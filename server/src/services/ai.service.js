const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
2. If valid, classify it with full details.

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
stray_animals, tree_fallen, flooding, other

--- SEVERITY ---
- critical: Life risk (road collapse, electrical hazard, major flooding)
- high: Major impact (main road pothole, large water leak, downed tree)
- medium: Moderate impact (irregular garbage, broken streetlight, minor leak)
- low: Minor impact (minor cracks, aesthetic issues, small encroachment)

--- DEPARTMENT LOGIC ---
Identify the correct Municipal Corporation based on the city/location provided. 
Examples:
- Mumbai → BMC (Brihanmumbai Municipal Corporation)
- Ulhasnagar → UMC (Ulhasnagar Municipal Corporation)
- Thane → TMC (Thane Municipal Corporation)
- Pune → PMC (Pune Municipal Corporation)
- Navi Mumbai → NMMC (Navi Mumbai Municipal Corporation)
- Kalyan-Dombivli → KDMC
- Delhi → MCD (Municipal Corporation of Delhi)
- Bengaluru → BBMP
- Chennai → GCC
If the city is not in this list, follow the pattern: [City Name] Municipal Corporation.

Return ONLY valid JSON in this exact format:
{
  "is_valid": true,
  "rejection_reason": null,
  "category": "road_pothole",
  "severity": "high",
  "department_name": "BMC Pothole Section",
  "reasoning": "Very short one-sentence summary (max 10 words)",
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

    try {
        const imageParts = images.map(img => ({
            inlineData: {
                data: img.base64,
                mimeType: img.mimeType
            }
        }));

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // Strip markdown code fences if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Gemini returned an invalid response format.');

        const parsed = JSON.parse(jsonMatch[0]);

        // Ensure required fields exist
        if (typeof parsed.is_valid !== 'boolean') {
            throw new Error('Gemini response missing is_valid field.');
        }

        return parsed;

    } catch (error) {
        console.error('Gemini Validation Error:', error);
        throw error;
    }
}

module.exports = { validateAndClassify };
