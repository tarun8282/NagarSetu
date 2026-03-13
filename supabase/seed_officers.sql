-- Supabase SQL Script to Seed 15 Departments & Officers for Every City
-- This directly creates users in both auth.users (with encrypted passwords) and public.officers
-- Run in the Supabase SQL Editor

DO $$ 
DECLARE 
    city_rec RECORD;
    dept_id UUID;
    dept_name TEXT;
    officer_username TEXT;
    officer_name TEXT;
    synthetic_email TEXT;
    new_user_id UUID;
    
    -- Array of your 15 departments: [Display Name, Slug]
    dept_list TEXT[][] := ARRAY[
        ['Administration', 'admin'],
        ['Finance', 'finance'],
        ['Public Works (PWD)', 'pwd'],
        ['Water Supply', 'water'],
        ['Sewerage and Drainage', 'sewerage'],
        ['Solid Waste Management', 'solidwaste'],
        ['Health', 'health'],
        ['Education', 'education'],
        ['Fire', 'fire'],
        ['Town Planning', 'townplanning'],
        ['Building and Construction', 'building'],
        ['Garden and Parks', 'gardens'],
        ['Transport', 'transport'],
        ['Environment', 'environment'],
        ['IT E-Governance', 'it']
    ];
    i INT;
BEGIN
    FOR city_rec IN SELECT id, state_id, LOWER(name) AS c_name, name AS city_proper_name FROM public.cities LOOP
        
        FOR i IN 1..array_length(dept_list, 1) LOOP
            dept_name := city_rec.city_proper_name || ' ' || dept_list[i][1];
            
            -- 1. Insert or Get Department
            -- Manually check if it exists since there is no unique constraint
            SELECT id INTO dept_id FROM public.departments WHERE city_id = city_rec.id AND category_slug = dept_list[i][2] LIMIT 1;
            
            IF dept_id IS NULL THEN
                INSERT INTO public.departments (city_id, name, category_slug) 
                VALUES (city_rec.id, dept_name, dept_list[i][2])
                RETURNING id INTO dept_id;
            END IF;
            
            -- Build standard username: e.g., mumbai_admin
            officer_username := city_rec.c_name || '_' || dept_list[i][2];
            officer_name := city_rec.city_proper_name || ' ' || split_part(dept_list[i][1], ' ', 1) || ' Officer';
            synthetic_email := officer_username || '@auth.nagarsetu.com';

            -- 2. Check if officer already exists in public.officers table
            IF NOT EXISTS (SELECT 1 FROM public.officers WHERE username = officer_username) THEN
                
                -- 3. Check if auth user already exists (just in case)
                SELECT id INTO new_user_id FROM auth.users WHERE email = synthetic_email;
                
                -- If not, create the dummy auth user with encrypted password!
                IF new_user_id IS NULL THEN
                    new_user_id := gen_random_uuid();
                    
                    INSERT INTO auth.users (
                        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
                        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
                        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
                    ) VALUES (
                        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
                        synthetic_email, crypt('password123', gen_salt('bf')), now(), 
                        now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 
                        ('{"name":"' || officer_name || '"}')::jsonb, now(), now(), '', '', '', ''
                    );
                END IF;

                -- 4. Finally, insert into public.officers linked to auth.users
                INSERT INTO public.officers (id, full_name, username, password, role, state_id, city_id, department_id)
                VALUES (new_user_id, officer_name, officer_username, 'password123', 'dept_officer', city_rec.state_id, city_rec.id, dept_id)
                ON CONFLICT (username) DO NOTHING;

            END IF;

        END LOOP;
    END LOOP;
END $$;
