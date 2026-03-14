-- ============================================================
-- COMPLETE SEED: States & Cities with Credentials
-- Username format: {code}_state / {city}_mc
-- Password format: {CODE}@State2024 / {City}@MC2024
-- ============================================================

-- STEP 1: INSERT STATES
INSERT INTO public.states (name, code, username, password) VALUES
  ('Andhra Pradesh',    'AP', 'ap_state', 'AP@State2024'),
  ('Arunachal Pradesh', 'AR', 'ar_state', 'AR@State2024'),
  ('Assam',             'AS', 'as_state', 'AS@State2024'),
  ('Bihar',             'BR', 'br_state', 'BR@State2024'),
  ('Chhattisgarh',      'CG', 'cg_state', 'CG@State2024'),
  ('Gujarat',           'GJ', 'gj_state', 'GJ@State2024'),
  ('Haryana',           'HR', 'hr_state', 'HR@State2024'),
  ('Himachal Pradesh',  'HP', 'hp_state', 'HP@State2024'),
  ('Jharkhand',         'JH', 'jh_state', 'JH@State2024'),
  ('Karnataka',         'KA', 'ka_state', 'KA@State2024'),
  ('Kerala',            'KL', 'kl_state', 'KL@State2024'),
  ('Madhya Pradesh',    'MP', 'mp_state', 'MP@State2024'),
  ('Maharashtra',       'MH', 'mh_state', 'MH@State2024'),
  ('Manipur',           'MN', 'mn_state', 'MN@State2024'),
  ('Mizoram',           'MZ', 'mz_state', 'MZ@State2024'),
  ('Odisha',            'OD', 'od_state', 'OD@State2024'),
  ('Punjab',            'PB', 'pb_state', 'PB@State2024'),
  ('Rajasthan',         'RJ', 'rj_state', 'RJ@State2024'),
  ('Tamil Nadu',        'TN', 'tn_state', 'TN@State2024'),
  ('Telangana',         'TS', 'ts_state', 'TS@State2024'),
  ('Tripura',           'TR', 'tr_state', 'TR@State2024'),
  ('Uttar Pradesh',     'UP', 'up_state', 'UP@State2024'),
  ('Uttarakhand',       'UK', 'uk_state', 'UK@State2024'),
  ('West Bengal',       'WB', 'wb_state', 'WB@State2024')
ON CONFLICT (code) DO NOTHING;


-- STEP 2: INSERT CITIES WITH CREDENTIALS

-- Andhra Pradesh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Visakhapatnam', 'Greater Visakhapatnam Municipal Corporation', 'visakhapatnam_mc', 'Visakhapatnam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Vijayawada',    'Vijayawada Municipal Corporation',            'vijayawada_mc',    'Vijayawada@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Guntur',        'Guntur Municipal Corporation',                'guntur_mc',        'Guntur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Nellore',       'Nellore Municipal Corporation',               'nellore_mc',       'Nellore@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Kurnool',       'Kurnool Municipal Corporation',               'kurnool_mc',       'Kurnool@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Rajahmundry',   'Rajahmundry Municipal Corporation',           'rajahmundry_mc',   'Rajahmundry@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Tirupati',      'Tirupati Municipal Corporation',              'tirupati_mc',      'Tirupati@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Kadapa',        'Kadapa Municipal Corporation',                'kadapa_mc',        'Kadapa@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Anantapur',     'Anantapur Municipal Corporation',             'anantapur_mc',     'Anantapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Eluru',         'Eluru Municipal Corporation',                 'eluru_mc',         'Eluru@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Ongole',        'Ongole Municipal Corporation',                'ongole_mc',        'Ongole@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Chittoor',      'Chittoor Municipal Corporation',              'chittoor_mc',      'Chittoor@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Machilipatnam', 'Machilipatnam Municipal Corporation',         'machilipatnam_mc', 'Machilipatnam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Srikakulam',    'Srikakulam Municipal Corporation',            'srikakulam_mc',    'Srikakulam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Vizianagaram',  'Vizianagaram Municipal Corporation',          'vizianagaram_mc',  'Vizianagaram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Tenali',        'Tenali Municipal Corporation',                'tenali_mc',        'Tenali@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AP'), 'Bhimavaram',    'Bhimavaram Municipal Corporation',            'bhimavaram_mc',    'Bhimavaram@MC2024');

-- Arunachal Pradesh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'AR'), 'Itanagar', 'Itanagar Municipal Corporation', 'itanagar_mc', 'Itanagar@MC2024');

-- Assam
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'AS'), 'Guwahati',  'Guwahati Municipal Corporation',  'guwahati_mc',  'Guwahati@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AS'), 'Dibrugarh', 'Dibrugarh Municipal Corporation', 'dibrugarh_mc', 'Dibrugarh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'AS'), 'Silchar',   'Silchar Municipal Corporation',   'silchar_mc',   'Silchar@MC2024');

-- Bihar
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Patna',        'Patna Municipal Corporation',        'patna_mc',       'Patna@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Gaya',         'Gaya Municipal Corporation',         'gaya_mc',        'Gaya@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Bhagalpur',    'Bhagalpur Municipal Corporation',    'bhagalpur_mc',   'Bhagalpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Muzaffarpur',  'Muzaffarpur Municipal Corporation',  'muzaffarpur_mc', 'Muzaffarpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Darbhanga',    'Darbhanga Municipal Corporation',    'darbhanga_mc',   'Darbhanga@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Purnia',       'Purnia Municipal Corporation',       'purnia_mc',      'Purnia@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Bihar Sharif', 'Bihar Sharif Municipal Corporation', 'biharsharif_mc', 'Biharsharif@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Ara',          'Ara Municipal Corporation',          'ara_mc',         'Ara@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Begusarai',    'Begusarai Municipal Corporation',    'begusarai_mc',   'Begusarai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Katihar',      'Katihar Municipal Corporation',      'katihar_mc',     'Katihar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Motihari',     'Motihari Municipal Corporation',     'motihari_mc',    'Motihari@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'BR'), 'Samastipur',   'Samastipur Municipal Corporation',   'samastipur_mc',  'Samastipur@MC2024');

-- Chhattisgarh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Raipur',      'Raipur Municipal Corporation',      'raipur_mc',      'Raipur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Bhilai',      'Bhilai Municipal Corporation',      'bhilai_mc',      'Bhilai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Durg',        'Durg Municipal Corporation',        'durg_mc',        'Durg@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Bilaspur',    'Bilaspur Municipal Corporation',    'bilaspur_mc',    'Bilaspur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Rajnandgaon', 'Rajnandgaon Municipal Corporation', 'rajnandgaon_mc', 'Rajnandgaon@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Jagdalpur',   'Jagdalpur Municipal Corporation',   'jagdalpur_mc',   'Jagdalpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Ambikapur',   'Ambikapur Municipal Corporation',   'ambikapur_mc',   'Ambikapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Raigarh',     'Raigarh Municipal Corporation',     'raigarh_mc',     'Raigarh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Chirmiri',    'Chirmiri Municipal Corporation',    'chirmiri_mc',    'Chirmiri@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Korba',       'Korba Municipal Corporation',       'korba_mc',       'Korba@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Dhamtari',    'Dhamtari Municipal Corporation',    'dhamtari_mc',    'Dhamtari@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Mahasamund',  'Mahasamund Municipal Corporation',  'mahasamund_mc',  'Mahasamund@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Bhatapara',   'Bhatapara Municipal Corporation',   'bhatapara_mc',   'Bhatapara@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'CG'), 'Kanker',      'Kanker Municipal Corporation',      'kanker_mc',      'Kanker@MC2024');

-- Gujarat
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Ahmedabad',    'Ahmedabad Municipal Corporation',    'ahmedabad_mc',    'Ahmedabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Surat',        'Surat Municipal Corporation',        'surat_mc',        'Surat@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Vadodara',     'Vadodara Municipal Corporation',     'vadodara_mc',     'Vadodara@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Rajkot',       'Rajkot Municipal Corporation',       'rajkot_mc',       'Rajkot@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Bhavnagar',    'Bhavnagar Municipal Corporation',    'bhavnagar_mc',    'Bhavnagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Jamnagar',     'Jamnagar Municipal Corporation',     'jamnagar_mc',     'Jamnagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Gandhinagar',  'Gandhinagar Municipal Corporation',  'gandhinagar_mc',  'Gandhinagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Junagadh',     'Junagadh Municipal Corporation',     'junagadh_mc',     'Junagadh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Anand',        'Anand Municipal Corporation',        'anand_mc',        'Anand@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Navsari',      'Navsari Municipal Corporation',      'navsari_mc',      'Navsari@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Surendranagar','Surendranagar Municipal Corporation','surendranagar_mc','Surendranagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Morbi',        'Morbi Municipal Corporation',        'morbi_mc',        'Morbi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Bharuch',      'Bharuch Municipal Corporation',      'bharuch_mc',      'Bharuch@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Porbandar',    'Porbandar Municipal Corporation',    'porbandar_mc',    'Porbandar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Mehsana',      'Mehsana Municipal Corporation',      'mehsana_mc',      'Mehsana@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Palanpur',     'Palanpur Municipal Corporation',     'palanpur_mc',     'Palanpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'GJ'), 'Gandhidham',   'Gandhidham Municipal Corporation',   'gandhidham_mc',   'Gandhidham@MC2024');

-- Haryana
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Gurugram',    'Gurugram Municipal Corporation',    'gurugram_mc',    'Gurugram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Faridabad',   'Faridabad Municipal Corporation',   'faridabad_mc',   'Faridabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Panipat',     'Panipat Municipal Corporation',     'panipat_mc',     'Panipat@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Ambala',      'Ambala Municipal Corporation',      'ambala_mc',      'Ambala@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Karnal',      'Karnal Municipal Corporation',      'karnal_mc',      'Karnal@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Rohtak',      'Rohtak Municipal Corporation',      'rohtak_mc',      'Rohtak@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Yamunanagar', 'Yamunanagar Municipal Corporation', 'yamunanagar_mc', 'Yamunanagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Hisar',       'Hisar Municipal Corporation',       'hisar_mc',       'Hisar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Sonipat',     'Sonipat Municipal Corporation',     'sonipat_mc',     'Sonipat@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Panchkula',   'Panchkula Municipal Corporation',   'panchkula_mc',   'Panchkula@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HR'), 'Manesar',     'Manesar Municipal Corporation',     'manesar_mc',     'Manesar@MC2024');

-- Himachal Pradesh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'HP'), 'Shimla',      'Shimla Municipal Corporation',      'shimla_mc',      'Shimla@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HP'), 'Dharamshala', 'Dharamshala Municipal Corporation', 'dharamshala_mc', 'Dharamshala@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HP'), 'Solan',       'Solan Municipal Corporation',       'solan_mc',       'Solan@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HP'), 'Mandi',       'Mandi Municipal Corporation',       'mandi_mc',       'Mandi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'HP'), 'Palampur',    'Palampur Municipal Corporation',    'palampur_mc',    'Palampur@MC2024');

-- Jharkhand
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Ranchi',     'Ranchi Municipal Corporation',     'ranchi_mc',     'Ranchi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Jamshedpur', 'Jamshedpur Municipal Corporation', 'jamshedpur_mc', 'Jamshedpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Dhanbad',    'Dhanbad Municipal Corporation',    'dhanbad_mc',    'Dhanbad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Bokaro',     'Bokaro Municipal Corporation',     'bokaro_mc',     'Bokaro@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Hazaribagh', 'Hazaribagh Municipal Corporation', 'hazaribagh_mc', 'Hazaribagh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Giridih',    'Giridih Municipal Corporation',    'giridih_mc',    'Giridih@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'JH'), 'Deoghar',    'Deoghar Municipal Corporation',    'deoghar_mc',    'Deoghar@MC2024');

-- Karnataka
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Bengaluru',        'Bruhat Bengaluru Municipal Corporation',   'bengaluru_mc',        'Bengaluru@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Mysuru',           'Mysuru Municipal Corporation',            'mysuru_mc',           'Mysuru@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Mangaluru',        'Mangaluru Municipal Corporation',         'mangaluru_mc',        'Mangaluru@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Hubballi-Dharwad', 'Hubballi-Dharwad Municipal Corporation', 'hubbalidharwad_mc',   'Hubbalidharwad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Belagavi',         'Belagavi Municipal Corporation',          'belagavi_mc',         'Belagavi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Kalaburagi',       'Kalaburagi Municipal Corporation',        'kalaburagi_mc',       'Kalaburagi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Ballari',          'Ballari Municipal Corporation',           'ballari_mc',          'Ballari@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Davanagere',       'Davanagere Municipal Corporation',        'davanagere_mc',       'Davanagere@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Shivamogga',       'Shivamogga Municipal Corporation',        'shivamogga_mc',       'Shivamogga@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Tumakuru',         'Tumakuru Municipal Corporation',          'tumakuru_mc',         'Tumakuru@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KA'), 'Vijayapura',       'Vijayapura Municipal Corporation',        'vijayapura_mc',       'Vijayapura@MC2024');

-- Kerala
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Thiruvananthapuram', 'Thiruvananthapuram Municipal Corporation', 'thiruvananthapuram_mc', 'Thiruvananthapuram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Kochi',             'Kochi Municipal Corporation',             'kochi_mc',             'Kochi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Kozhikode',         'Kozhikode Municipal Corporation',         'kozhikode_mc',         'Kozhikode@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Kollam',            'Kollam Municipal Corporation',            'kollam_mc',            'Kollam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Thrissur',          'Thrissur Municipal Corporation',          'thrissur_mc',          'Thrissur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'KL'), 'Alappuzha',         'Alappuzha Municipal Corporation',         'alappuzha_mc',         'Alappuzha@MC2024');

-- Madhya Pradesh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Indore',     'Indore Municipal Corporation',     'indore_mc',     'Indore@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Bhopal',     'Bhopal Municipal Corporation',     'bhopal_mc',     'Bhopal@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Jabalpur',   'Jabalpur Municipal Corporation',   'jabalpur_mc',   'Jabalpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Gwalior',    'Gwalior Municipal Corporation',    'gwalior_mc',    'Gwalior@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Ujjain',     'Ujjain Municipal Corporation',     'ujjain_mc',     'Ujjain@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Sagar',      'Sagar Municipal Corporation',      'sagar_mc',      'Sagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Satna',      'Satna Municipal Corporation',      'satna_mc',      'Satna@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Khandwa',    'Khandwa Municipal Corporation',    'khandwa_mc',    'Khandwa@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Burhanpur',  'Burhanpur Municipal Corporation',  'burhanpur_mc',  'Burhanpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Chhindwara', 'Chhindwara Municipal Corporation', 'chhindwara_mc', 'Chhindwara@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Katni',      'Katni Municipal Corporation',      'katni_mc',      'Katni@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Rewa',       'Rewa Municipal Corporation',       'rewa_mc',       'Rewa@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Singrauli',  'Singrauli Municipal Corporation',  'singrauli_mc',  'Singrauli@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Dewas',      'Dewas Municipal Corporation',      'dewas_mc',      'Dewas@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Ratlam',     'Ratlam Municipal Corporation',     'ratlam_mc',     'Ratlam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MP'), 'Neemuch',    'Neemuch Municipal Corporation',    'neemuch_mc',    'Neemuch@MC2024');

-- Maharashtra
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Mumbai',             'Mumbai Municipal Corporation',             'mumbai_mc',          'Mumbai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Pune',               'Pune Municipal Corporation',               'pune_mc',            'Pune@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Nagpur',             'Nagpur Municipal Corporation',             'nagpur_mc',          'Nagpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Thane',              'Thane Municipal Corporation',              'thane_mc',           'Thane@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Nashik',             'Nashik Municipal Corporation',             'nashik_mc',          'Nashik@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Pimpri-Chinchwad',   'Pimpri-Chinchwad Municipal Corporation',   'pimprichinchwad_mc', 'Pimprichinchwad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Navi Mumbai',        'Navi Mumbai Municipal Corporation',        'navimumbai_mc',      'Navimumbai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Kalyan-Dombivli',    'Kalyan-Dombivli Municipal Corporation',    'kalyandombivli_mc',  'Kalyandombivli@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Vasai-Virar',        'Vasai-Virar Municipal Corporation',        'vasaivirar_mc',      'Vasaivirar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Aurangabad',         'Aurangabad Municipal Corporation',         'aurangabad_mc',      'Aurangabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Solapur',            'Solapur Municipal Corporation',            'solapur_mc',         'Solapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Kolhapur',           'Kolhapur Municipal Corporation',           'kolhapur_mc',        'Kolhapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Amravati',           'Amravati Municipal Corporation',           'amravati_mc',        'Amravati@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Nanded',             'Nanded Municipal Corporation',             'nanded_mc',          'Nanded@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Sangli-Miraj-Kupwad','Sangli-Miraj-Kupwad Municipal Corporation','sangli_mc',          'Sangli@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Jalgaon',            'Jalgaon Municipal Corporation',            'jalgaon_mc',         'Jalgaon@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Akola',              'Akola Municipal Corporation',              'akola_mc',           'Akola@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Latur',              'Latur Municipal Corporation',              'latur_mc',           'Latur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Dhule',              'Dhule Municipal Corporation',              'dhule_mc',           'Dhule@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Ahmednagar',         'Ahmednagar Municipal Corporation',         'ahmednagar_mc',      'Ahmednagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Parbhani',           'Parbhani Municipal Corporation',           'parbhani_mc',        'Parbhani@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Chandrapur',         'Chandrapur Municipal Corporation',         'chandrapur_mc',      'Chandrapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Panvel',             'Panvel Municipal Corporation',             'panvel_mc',          'Panvel@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Bhiwandi-Nizampur',  'Bhiwandi-Nizampur Municipal Corporation',  'bhiwandi_mc',        'Bhiwandi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Ulhasnagar',         'Ulhasnagar Municipal Corporation',         'ulhasnagar_mc',      'Ulhasnagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Malegaon',           'Malegaon Municipal Corporation',           'malegaon_mc',        'Malegaon@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Mira-Bhayandar',     'Mira-Bhayandar Municipal Corporation',     'mirabhayandar_mc',   'Mirabhayandar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Gondia',             'Gondia Municipal Corporation',             'gondia_mc',          'Gondia@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'MH'), 'Yavatmal',           'Yavatmal Municipal Corporation',           'yavatmal_mc',        'Yavatmal@MC2024');

-- Manipur
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'MN'), 'Imphal', 'Imphal Municipal Corporation', 'imphal_mc', 'Imphal@MC2024');

-- Mizoram
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'MZ'), 'Aizawl', 'Aizawl Municipal Corporation', 'aizawl_mc', 'Aizawl@MC2024');

-- Odisha
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'OD'), 'Bhubaneswar', 'Bhubaneswar Municipal Corporation', 'bhubaneswar_mc', 'Bhubaneswar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'OD'), 'Cuttack',     'Cuttack Municipal Corporation',     'cuttack_mc',     'Cuttack@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'OD'), 'Berhampur',   'Berhampur Municipal Corporation',   'berhampur_mc',   'Berhampur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'OD'), 'Sambalpur',   'Sambalpur Municipal Corporation',   'sambalpur_mc',   'Sambalpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'OD'), 'Rourkela',    'Rourkela Municipal Corporation',    'rourkela_mc',    'Rourkela@MC2024');

-- Punjab
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Ludhiana',   'Ludhiana Municipal Corporation',   'ludhiana_mc',   'Ludhiana@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Amritsar',   'Amritsar Municipal Corporation',   'amritsar_mc',   'Amritsar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Jalandhar',  'Jalandhar Municipal Corporation',  'jalandhar_mc',  'Jalandhar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Patiala',    'Patiala Municipal Corporation',    'patiala_mc',    'Patiala@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Bathinda',   'Bathinda Municipal Corporation',   'bathinda_mc',   'Bathinda@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Mohali',     'Mohali Municipal Corporation',     'mohali_mc',     'Mohali@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Hoshiarpur', 'Hoshiarpur Municipal Corporation', 'hoshiarpur_mc', 'Hoshiarpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'PB'), 'Pathankot',  'Pathankot Municipal Corporation',  'pathankot_mc',  'Pathankot@MC2024');

-- Rajasthan
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Jaipur',    'Jaipur Municipal Corporation',    'jaipur_mc',    'Jaipur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Jodhpur',   'Jodhpur Municipal Corporation',   'jodhpur_mc',   'Jodhpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Kota',      'Kota Municipal Corporation',      'kota_mc',      'Kota@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Ajmer',     'Ajmer Municipal Corporation',     'ajmer_mc',     'Ajmer@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Bikaner',   'Bikaner Municipal Corporation',   'bikaner_mc',   'Bikaner@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Udaipur',   'Udaipur Municipal Corporation',   'udaipur_mc',   'Udaipur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Bharatpur', 'Bharatpur Municipal Corporation', 'bharatpur_mc', 'Bharatpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Alwar',     'Alwar Municipal Corporation',     'alwar_mc',     'Alwar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Bhilwara',  'Bhilwara Municipal Corporation',  'bhilwara_mc',  'Bhilwara@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'RJ'), 'Sikar',     'Sikar Municipal Corporation',     'sikar_mc',     'Sikar@MC2024');

-- Tamil Nadu
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Chennai',         'Chennai Municipal Corporation',         'chennai_mc',         'Chennai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Coimbatore',      'Coimbatore Municipal Corporation',      'coimbatore_mc',      'Coimbatore@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Madurai',         'Madurai Municipal Corporation',         'madurai_mc',         'Madurai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Tiruchirappalli', 'Tiruchirappalli Municipal Corporation', 'tiruchirappalli_mc', 'Tiruchirappalli@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Salem',           'Salem Municipal Corporation',           'salem_mc',           'Salem@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Tirunelveli',     'Tirunelveli Municipal Corporation',     'tirunelveli_mc',     'Tirunelveli@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Tiruppur',        'Tiruppur Municipal Corporation',        'tiruppur_mc',        'Tiruppur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Erode',           'Erode Municipal Corporation',           'erode_mc',           'Erode@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Vellore',         'Vellore Municipal Corporation',         'vellore_mc',         'Vellore@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Thoothukudi',     'Thoothukudi Municipal Corporation',     'thoothukudi_mc',     'Thoothukudi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Dindigul',        'Dindigul Municipal Corporation',        'dindigul_mc',        'Dindigul@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Thanjavur',       'Thanjavur Municipal Corporation',       'thanjavur_mc',       'Thanjavur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Kancheepuram',    'Kancheepuram Municipal Corporation',    'kancheepuram_mc',    'Kancheepuram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Karur',           'Karur Municipal Corporation',           'karur_mc',           'Karur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Nagercoil',       'Nagercoil Municipal Corporation',       'nagercoil_mc',       'Nagercoil@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Hosur',           'Hosur Municipal Corporation',           'hosur_mc',           'Hosur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Avadi',           'Avadi Municipal Corporation',           'avadi_mc',           'Avadi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Tambaram',        'Tambaram Municipal Corporation',        'tambaram_mc',        'Tambaram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Kumbakonam',      'Kumbakonam Municipal Corporation',      'kumbakonam_mc',      'Kumbakonam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Sivakasi',        'Sivakasi Municipal Corporation',        'sivakasi_mc',        'Sivakasi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Ramanathapuram',  'Ramanathapuram Municipal Corporation',  'ramanathapuram_mc',  'Ramanathapuram@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Tiruvannamalai',  'Tiruvannamalai Municipal Corporation',  'tiruvannamalai_mc',  'Tiruvannamalai@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Pollachi',        'Pollachi Municipal Corporation',        'pollachi_mc',        'Pollachi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Virudhunagar',    'Virudhunagar Municipal Corporation',    'virudhunagar_mc',    'Virudhunagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TN'), 'Mayiladuthurai',  'Mayiladuthurai Municipal Corporation',  'mayiladuthurai_mc',  'Mayiladuthurai@MC2024');

-- Telangana
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Hyderabad',   'Greater Hyderabad Municipal Corporation', 'hyderabad_mc',   'Hyderabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Warangal',    'Warangal Municipal Corporation',          'warangal_mc',    'Warangal@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Nizamabad',   'Nizamabad Municipal Corporation',         'nizamabad_mc',   'Nizamabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Karimnagar',  'Karimnagar Municipal Corporation',        'karimnagar_mc',  'Karimnagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Ramagundam',  'Ramagundam Municipal Corporation',        'ramagundam_mc',  'Ramagundam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Khammam',     'Khammam Municipal Corporation',           'khammam_mc',     'Khammam@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Mahbubnagar', 'Mahbubnagar Municipal Corporation',       'mahbubnagar_mc', 'Mahbubnagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Nalgonda',    'Nalgonda Municipal Corporation',          'nalgonda_mc',    'Nalgonda@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Siddipet',    'Siddipet Municipal Corporation',          'siddipet_mc',    'Siddipet@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Suryapet',    'Suryapet Municipal Corporation',          'suryapet_mc',    'Suryapet@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Miryalaguda', 'Miryalaguda Municipal Corporation',       'miryalaguda_mc', 'Miryalaguda@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Adilabad',    'Adilabad Municipal Corporation',          'adilabad_mc',    'Adilabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'TS'), 'Jagitial',    'Jagitial Municipal Corporation',          'jagitial_mc',    'Jagitial@MC2024');

-- Tripura
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'TR'), 'Agartala', 'Agartala Municipal Corporation', 'agartala_mc', 'Agartala@MC2024');

-- Uttar Pradesh
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Lucknow',    'Lucknow Municipal Corporation',    'lucknow_mc',    'Lucknow@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Kanpur',     'Kanpur Municipal Corporation',     'kanpur_mc',     'Kanpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Ghaziabad',  'Ghaziabad Municipal Corporation',  'ghaziabad_mc',  'Ghaziabad@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Agra',       'Agra Municipal Corporation',       'agra_mc',       'Agra@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Varanasi',   'Varanasi Municipal Corporation',   'varanasi_mc',   'Varanasi@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Meerut',     'Meerut Municipal Corporation',     'meerut_mc',     'Meerut@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Prayagraj',  'Prayagraj Municipal Corporation',  'prayagraj_mc',  'Prayagraj@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Gorakhpur',  'Gorakhpur Municipal Corporation',  'gorakhpur_mc',  'Gorakhpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Aligarh',    'Aligarh Municipal Corporation',    'aligarh_mc',    'Aligarh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Saharanpur', 'Saharanpur Municipal Corporation', 'saharanpur_mc', 'Saharanpur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Bareilly',   'Bareilly Municipal Corporation',   'bareilly_mc',   'Bareilly@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Mathura',    'Mathura Municipal Corporation',    'mathura_mc',    'Mathura@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UP'), 'Firozabad',  'Firozabad Municipal Corporation',  'firozabad_mc',  'Firozabad@MC2024');

-- Uttarakhand
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Dehradun',  'Dehradun Municipal Corporation',  'dehradun_mc',  'Dehradun@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Haridwar',  'Haridwar Municipal Corporation',  'haridwar_mc',  'Haridwar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Rishikesh', 'Rishikesh Municipal Corporation', 'rishikesh_mc', 'Rishikesh@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Rudrapur',  'Rudrapur Municipal Corporation',  'rudrapur_mc',  'Rudrapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Haldwani',  'Haldwani Municipal Corporation',  'haldwani_mc',  'Haldwani@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Kashipur',  'Kashipur Municipal Corporation',  'kashipur_mc',  'Kashipur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Roorkee',   'Roorkee Municipal Corporation',   'roorkee_mc',   'Roorkee@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'UK'), 'Kotdwar',   'Kotdwar Municipal Corporation',   'kotdwar_mc',   'Kotdwar@MC2024');

-- West Bengal
INSERT INTO public.cities (state_id, name, official_name, username, password) VALUES
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Kolkata',      'Kolkata Municipal Corporation',      'kolkata_mc',      'Kolkata@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Howrah',       'Howrah Municipal Corporation',       'howrah_mc',       'Howrah@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Asansol',      'Asansol Municipal Corporation',      'asansol_mc',      'Asansol@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Bidhannagar',  'Bidhannagar Municipal Corporation',  'bidhannagar_mc',  'Bidhannagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Durgapur',     'Durgapur Municipal Corporation',     'durgapur_mc',     'Durgapur@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Chandannagar', 'Chandannagar Municipal Corporation', 'chandannagar_mc', 'Chandannagar@MC2024'),
  ((SELECT id FROM public.states WHERE code = 'WB'), 'Siliguri',     'Siliguri Municipal Corporation',     'siliguri_mc',     'Siliguri@MC2024');

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT COUNT(*) FROM public.states;                          -- 24
-- SELECT COUNT(*) FROM public.cities;                          -- 246
-- SELECT COUNT(*) FROM public.states WHERE username IS NULL;   -- 0
-- SELECT COUNT(*) FROM public.cities WHERE username IS NULL;   -- 0