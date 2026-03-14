const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim());
console.log(`[AI] Initialized with API Key: ${process.env.GEMINI_API_KEY ? 'Present (' + process.env.GEMINI_API_KEY.trim().length + ' chars)' : 'MISSING'}`);

// Primary and fallback models - Gemini 3 models appear to have available quota
const MODELS = ['models/gemini-3-flash-preview', 'models/gemini-3-pro-preview', 'models/gemini-2.0-flash', 'models/gemini-flash-lite-latest'];


/**
 * Validates AND classifies a civic complaint using Gemini AI.
 * Runs SYNCHRONOUSLY before the complaint is saved to the database.
 *
 * Returns:
 *  - is_valid: boolean — whether this is a genuine civic complaint
 *  - rejection_reason: string | null — human-readable reason if rejected
 *  - category, severity, department_name, reasoning, confidence_score — if valid
 */
async function validateAndClassify(complaintData, images = []) {
    const { title, description, city, state } = complaintData;

    const prompt = `
You are an AI gatekeeper for a government civic complaint portal in India.
Your job is to:
1. Determine if this is a GENUINE civic/municipal complaint worth registering.
2. If valid, classify it with full details including the correct department.

Complaint Title: ${title}
Complaint Description: ${description}
Location: ${city}, ${state}

--- VALIDATION RULES ---
Mark is_valid as FALSE if:
- The complaint is spam, gibberish, or clearly fake (e.g. "test", "asdfgh", random characters)
- It is not a civic/municipal issue (e.g. personal disputes, private property issues, political complaints)
- The description is too vague to act on (e.g. "everything is bad", "fix the city")
- It is a duplicate intent with no specific location or detail
- It is abusive, offensive, or irrelevant

Mark is_valid as TRUE if it describes a real, actionable civic problem.

--- CATEGORIES (use exact slug) ---
road_pothole, road_damage, water_leakage, water_shortage, garbage_overflow,
garbage_collection, electricity_outage, streetlight, sanitation_drain,
sanitation_toilet, illegal_construction, noise_pollution, encroachment,
stray_animals, tree_fallen, flooding, park_damage, building_permit,
fire_hazard, environment_pollution, other

--- SEVERITY RULES (assign carefully based on actual impact) ---
CRITICAL — Immediate threat to life or safety:
  • Road collapse, sinkhole, or bridge damage
  • Live/exposed electrical wires or major electrical hazard
  • Major flooding blocking roads or entering homes
  • Sewage overflow into drinking water supply
  • Fire hazard or active fire risk
  • Fallen tree blocking main road or on a building
  • Complete water supply failure in an area

HIGH — Major disruption to daily life:
  • Large potholes on main roads causing accidents
  • Significant water pipeline burst or major leak
  • Garbage not collected for 5+ days causing health risk
  • Complete electricity outage for a colony/area
  • Blocked main drainage causing waterlogging
  • Illegal construction actively in progress
  • Stray animal attack risk (pack of dogs, etc.)

MEDIUM — Moderate inconvenience, needs timely action:
  • Potholes on side streets or lanes
  • Minor water leakage or dripping pipes
  • Irregular garbage collection (missed 2–3 days)
  • Broken or non-functional streetlight
  • Partially blocked drain
  • Minor encroachment on footpath
  • Single stray animal complaint
  • Noise pollution complaint
  • Minor road cracks not causing accidents

LOW — Minor issue, cosmetic or low-impact:
  • Minor pavement cracks or uneven tiles
  • Overgrown grass in parks
  • Faded road markings
  • Small pothole in low-traffic lane
  • Aesthetic damage to public infrastructure
  • Minor water seepage (not a burst pipe)

--- DEPARTMENT MAPPING ---
Assign department_name based on the category AND the correct municipal body for the city.

First, identify the Municipal Corporation:
- Mumbai → BMC (Brihanmumbai Municipal Corporation)
- Ulhasnagar → UMC (Ulhasnagar Municipal Corporation)
- Thane → TMC (Thane Municipal Corporation)
- Pune → PMC (Pune Municipal Corporation)
- Navi Mumbai → NMMC (Navi Mumbai Municipal Corporation)
- Kalyan-Dombivli → KDMC (Kalyan-Dombivli Municipal Corporation)
- Delhi → MCD (Municipal Corporation of Delhi)
- Bengaluru → BBMP (Bruhat Bengaluru Mahanagara Palike)
- Chennai → GCC (Greater Chennai Corporation)
- Hyderabad → GHMC (Greater Hyderabad Municipal Corporation)
- Ahmedabad → AMC (Ahmedabad Municipal Corporation)
- For any other city: [City Name] Municipal Corporation

Then append the correct department division based on category:
- road_pothole, road_damage → "[CORP] - Public Works Department"
- water_leakage, water_shortage → "[CORP] - Water Supply Department"
- garbage_overflow, garbage_collection → "[CORP] - Solid Waste Management Department"
- electricity_outage, streetlight → "[CORP] - Electrical Department"
- sanitation_drain, sanitation_toilet → "[CORP] - Sewerage and Drainage Department"
- illegal_construction, building_permit → "[CORP] - Building and Construction Department"
- encroachment → "[CORP] - Town Planning Department"
- noise_pollution, environment_pollution → "[CORP] - Environment Department"
- stray_animals → "[CORP] - Health Department"
- tree_fallen, park_damage → "[CORP] - Garden and Parks Department"
- flooding → "[CORP] - Sewerage and Drainage Department"
- fire_hazard → "[CORP] - Fire Department"
- other → "[CORP] - Administration Department"

Example: A pothole in Mumbai → "BMC - Public Works Department"
Example: Water leak in Pune → "PMC - Water Supply Department"

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "is_valid": true,
  "rejection_reason": null,
  "category": "road_pothole",
  "severity": "medium",
  "department_name": "BMC - Public Works Department",
  "reasoning": "Pothole on side lane causing minor disruption",
  "confidence_score": 0.92
}

If rejecting, return:
{
  "is_valid": false,
  "rejection_reason": "Clear one-sentence reason why this complaint cannot be registered",
  "category": null,
  "severity": null,
  "department_name": null,
  "reasoning": null,
  "confidence_score": null
}
`;

    let lastError = null;
    let responseText = null;

    for (const modelName of MODELS) {
        try {
            console.log(`[AI] Attempting classification with ${modelName}...`);
            const currentModel = genAI.getGenerativeModel({ model: modelName });
            
            const imageParts = images.map(img => ({
                inlineData: {
                    data: img.base64,
                    mimeType: img.mimeType
                }
            }));

            const result = await currentModel.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            responseText = response.text();
            
            if (responseText) {
                console.log(`[AI] Successfully used ${modelName}`);
                break;
            }
        } catch (err) {
            console.warn(`[AI] Model ${modelName} failed: ${err.message}`);
            lastError = err;
            continue;
        }
    }

    if (!responseText) {
        console.error('[AI] All Gemini models failed.');
        throw lastError || new Error('All Gemini models failed to respond.');
    }

    try {
        const text = responseText;

        // Strip markdown code fences if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Gemini returned an invalid response format.');

        const parsed = JSON.parse(jsonMatch[0]);

        // Ensure required fields exist
        if (typeof parsed.is_valid !== 'boolean') {
            throw new Error('Gemini response missing is_valid field.');
        }

        // Validate severity value if complaint is valid
        if (parsed.is_valid) {
            const validSeverities = ['critical', 'high', 'medium', 'low'];
            if (!validSeverities.includes(parsed.severity)) {
                console.warn(`Unexpected severity value: ${parsed.severity}, defaulting to 'medium'`);
                parsed.severity = 'medium';
            }
        }

        return parsed;

    } catch (error) {
        console.error('--- Gemini Validation Error ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.stack) console.error('Stack Trace:', error.stack);
        console.error('-------------------------------');
        throw error;
    }
}

module.exports = { validateAndClassify };