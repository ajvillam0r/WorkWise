<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class GigWorkerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create diverse gig workers with different skill sets and experience levels
        $gigWorkers = [
            // Full-Stack Developers
            [
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'email' => 'carlos.mendoza@developer.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Senior Full-Stack Developer',
                'bio' => 'Experienced full-stack developer with 5+ years building web applications for Filipino businesses. Specialized in e-commerce platforms, payment integrations, and scalable web solutions. Fluent in English and Filipino.',
                'location' => 'Manila, Metro Manila',
                'phone' => '+639171234568',
                'hourly_rate' => 800.00,
                'experience_level' => 'expert',
                'skills' => ['PHP', 'Laravel', 'JavaScript', 'Vue.js', 'React', 'MySQL', 'PostgreSQL', 'API Development', 'Payment Integration', 'AWS', 'Docker'],
                'languages' => ['English', 'Filipino', 'Cebuano'],
                'portfolio_url' => 'https://carlosmendoza.dev',
            ],
            [
                'first_name' => 'Michelle',
                'last_name' => 'Garcia',
                'email' => 'michelle.garcia@webdev.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Full-Stack Web Developer',
                'bio' => 'Passionate web developer with expertise in modern JavaScript frameworks and PHP. Love creating responsive, user-friendly websites that help Filipino businesses grow online. Strong background in e-commerce and CMS development.',
                'location' => 'Cebu City, Cebu',
                'phone' => '+639181234568',
                'hourly_rate' => 650.00,
                'experience_level' => 'intermediate',
                'skills' => ['PHP', 'Laravel', 'JavaScript', 'Vue.js', 'MySQL', 'WordPress', 'Responsive Design', 'API Development', 'Git'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://michellegarcia.portfolio.com',
            ],

            // Mobile Developers
            [
                'first_name' => 'James',
                'last_name' => 'Reyes',
                'email' => 'james.reyes@mobiledev.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'React Native Mobile Developer',
                'bio' => 'Mobile app developer specializing in React Native and cross-platform development. Created apps for food delivery, e-commerce, and service booking platforms in the Philippines. Expert in integrating local payment methods and push notifications.',
                'location' => 'Davao City, Davao del Sur',
                'phone' => '+639191234568',
                'hourly_rate' => 700.00,
                'experience_level' => 'intermediate',
                'skills' => ['React Native', 'JavaScript', 'TypeScript', 'Firebase', 'Push Notifications', 'Mobile UI/UX', 'API Integration', 'App Store Deployment'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://jamesreyes.mobile.dev',
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Cruz',
                'email' => 'sarah.cruz@flutter.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Flutter Mobile Developer',
                'bio' => 'Flutter developer with a passion for creating beautiful, performant mobile applications. Experience in building apps for various industries including healthcare, education, and retail in the Philippine market.',
                'location' => 'Quezon City, Metro Manila',
                'phone' => '+639201234568',
                'hourly_rate' => 600.00,
                'experience_level' => 'intermediate',
                'skills' => ['Flutter', 'Dart', 'Firebase', 'SQLite', 'REST APIs', 'Mobile UI/UX', 'State Management'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://sarahcruz.flutter.dev',
            ],

            // Designers
            [
                'first_name' => 'Mark',
                'last_name' => 'Villanueva',
                'email' => 'mark.villanueva@design.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Brand Identity & Graphic Designer',
                'bio' => 'Creative graphic designer with 4+ years of experience in brand identity, logo design, and marketing materials. Specialized in creating designs that resonate with Filipino culture while maintaining modern aesthetics. Worked with restaurants, startups, and local businesses.',
                'location' => 'Iloilo City, Iloilo',
                'phone' => '+639211234568',
                'hourly_rate' => 450.00,
                'experience_level' => 'intermediate',
                'skills' => ['Graphic Design', 'Logo Design', 'Brand Identity', 'Adobe Creative Suite', 'Photoshop', 'Illustrator', 'InDesign', 'Typography', 'Print Design'],
                'languages' => ['English', 'Filipino', 'Hiligaynon'],
                'portfolio_url' => 'https://markvillanueva.design',
            ],
            [
                'first_name' => 'Jenny',
                'last_name' => 'Flores',
                'email' => 'jenny.flores@socialmedia.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Social Media Designer & Content Creator',
                'bio' => 'Social media specialist and graphic designer creating engaging content for Filipino brands. Expert in current social media trends, visual storytelling, and creating content that drives engagement across Facebook, Instagram, and TikTok.',
                'location' => 'Baguio City, Benguet',
                'phone' => '+639221234568',
                'hourly_rate' => 350.00,
                'experience_level' => 'beginner',
                'skills' => ['Social Media Design', 'Canva', 'Adobe Photoshop', 'Content Creation', 'Animation', 'Video Editing', 'Filipino Culture', 'Trend Analysis'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://jennyflores.social',
            ],

            // Content Writers and Marketers
            [
                'first_name' => 'Patricia',
                'last_name' => 'Santos',
                'email' => 'patricia.santos@writer.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Content Writer & SEO Specialist',
                'bio' => 'Professional content writer with expertise in SEO, business writing, and Filipino market insights. Created content for various industries including technology, food, travel, and business. Skilled in both English and Filipino content creation.',
                'location' => 'Makati City, Metro Manila',
                'phone' => '+639231234568',
                'hourly_rate' => 400.00,
                'experience_level' => 'intermediate',
                'skills' => ['Content Writing', 'SEO Writing', 'Filipino Language', 'Business Writing', 'Research', 'WordPress', 'Google Analytics', 'Keyword Research'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://patriciasantos.writer.com',
            ],
            [
                'first_name' => 'Rico',
                'last_name' => 'Dela Rosa',
                'email' => 'rico.delarosa@marketing.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Digital Marketing Specialist',
                'bio' => 'Digital marketing expert with deep understanding of the Philippine market. Specialized in local SEO, social media marketing, and PPC campaigns. Helped numerous Filipino businesses improve their online presence and reach their target audience.',
                'location' => 'Taguig City, Metro Manila',
                'phone' => '+639241234568',
                'hourly_rate' => 550.00,
                'experience_level' => 'expert',
                'skills' => ['Digital Marketing', 'Local SEO', 'Google Ads', 'Facebook Ads', 'Analytics', 'Social Media Marketing', 'Email Marketing', 'Conversion Optimization'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://ricodelarosa.marketing',
            ],

            // Virtual Assistants and Administrative
            [
                'first_name' => 'Grace',
                'last_name' => 'Morales',
                'email' => 'grace.morales@va.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Virtual Assistant & Customer Service Specialist',
                'bio' => 'Experienced virtual assistant with excellent communication skills in English and Filipino. Specialized in customer service, email management, appointment scheduling, and administrative support. Available during Philippine business hours with flexible scheduling.',
                'location' => 'Antipolo City, Rizal',
                'phone' => '+639251234568',
                'hourly_rate' => 280.00,
                'experience_level' => 'intermediate',
                'skills' => ['Virtual Assistance', 'Customer Service', 'Email Management', 'CRM Software', 'Communication', 'Time Management', 'Data Entry', 'Scheduling'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://gracemorales.va.com',
            ],
            [
                'first_name' => 'Daniel',
                'last_name' => 'Aquino',
                'email' => 'daniel.aquino@dataentry.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Data Entry Specialist & Database Manager',
                'bio' => 'Detail-oriented data entry specialist with expertise in database management and data analysis. Fast and accurate typing skills with experience in various CRM systems, spreadsheet management, and data processing for Filipino businesses.',
                'location' => 'Las Piñas City, Metro Manila',
                'phone' => '+639261234568',
                'hourly_rate' => 220.00,
                'experience_level' => 'beginner',
                'skills' => ['Data Entry', 'Excel', 'Google Sheets', 'Database Management', 'Attention to Detail', 'Data Analysis', 'CRM Systems', 'Typing Speed'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://danielaquino.data.com',
            ],

            // Specialized Professionals
            [
                'first_name' => 'Maria Elena',
                'last_name' => 'Ramos',
                'email' => 'mariaelena.ramos@accounting.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Certified Public Accountant & Bookkeeper',
                'bio' => 'Licensed CPA with 6+ years of experience in accounting, bookkeeping, and tax preparation. Specialized in Philippine tax law, BIR compliance, and financial management for small to medium enterprises. Proficient in various accounting software.',
                'location' => 'Pasig City, Metro Manila',
                'phone' => '+639271234568',
                'hourly_rate' => 500.00,
                'experience_level' => 'expert',
                'skills' => ['Accounting', 'Bookkeeping', 'QuickBooks', 'Tax Preparation', 'Financial Analysis', 'Philippine Tax Law', 'BIR Compliance', 'Financial Reporting'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://mariaelenaramos.cpa.ph',
            ],

            // WordPress Specialists
            [
                'first_name' => 'Kevin',
                'last_name' => 'Bautista',
                'email' => 'kevin.bautista@wordpress.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'WordPress Developer & SEO Specialist',
                'bio' => 'WordPress expert with strong SEO knowledge and experience in creating optimized websites for Filipino businesses. Specialized in responsive design, page speed optimization, and local SEO strategies that work in the Philippine market.',
                'location' => 'Caloocan City, Metro Manila',
                'phone' => '+639281234568',
                'hourly_rate' => 420.00,
                'experience_level' => 'intermediate',
                'skills' => ['WordPress', 'PHP', 'SEO', 'Responsive Design', 'Google Analytics', 'Social Media Integration', 'Page Speed Optimization', 'Local SEO'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://kevinbautista.wp.dev',
            ],

            // UI/UX Designers
            [
                'first_name' => 'Sophia',
                'last_name' => 'Hernandez',
                'email' => 'sophia.hernandez@ux.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'UI/UX Designer',
                'bio' => 'UI/UX designer passionate about creating user-centered designs that work well for Filipino users. Experience in mobile app design, web interfaces, and user research. Understanding of local user behavior and cultural preferences.',
                'location' => 'Muntinlupa City, Metro Manila',
                'phone' => '+639291234568',
                'hourly_rate' => 480.00,
                'experience_level' => 'intermediate',
                'skills' => ['UI/UX Design', 'Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Mobile UI/UX', 'Responsive Design'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://sophiahernandez.ux.design',
            ],

            // Video Editors and Multimedia
            [
                'first_name' => 'Miguel',
                'last_name' => 'Torres',
                'email' => 'miguel.torres@video.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Video Editor & Motion Graphics Designer',
                'bio' => 'Creative video editor and motion graphics designer with experience in creating engaging content for social media, marketing campaigns, and corporate videos. Familiar with Filipino entertainment preferences and viral content trends.',
                'location' => 'Marikina City, Metro Manila',
                'phone' => '+639301234568',
                'hourly_rate' => 380.00,
                'experience_level' => 'intermediate',
                'skills' => ['Video Editing', 'Motion Graphics', 'After Effects', 'Premiere Pro', 'Animation', 'Social Media Content', 'Color Grading', 'Audio Editing'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://migueltorres.video.com',
            ],

            // Junior Developers
            [
                'first_name' => 'Anna',
                'last_name' => 'Perez',
                'email' => 'anna.perez@junior.dev.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Junior Web Developer',
                'bio' => 'Enthusiastic junior web developer eager to work on exciting projects. Recently completed web development bootcamp and looking to gain more experience. Strong foundation in HTML, CSS, JavaScript, and basic PHP. Quick learner and dedicated to delivering quality work.',
                'location' => 'San Juan City, Metro Manila',
                'phone' => '+639311234568',
                'hourly_rate' => 250.00,
                'experience_level' => 'beginner',
                'skills' => ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Responsive Design', 'Git', 'Bootstrap'],
                'languages' => ['English', 'Filipino'],
                'portfolio_url' => 'https://annaperez.junior.dev',
            ],
        ];

        foreach ($gigWorkers as $workerData) {
            // Check if gig worker already exists
            $existingWorker = User::where('email', $workerData['email'])->first();
            
            if ($existingWorker) {
                echo "Gig worker {$workerData['email']} already exists, skipping creation.\n";
            } else {
                User::create($workerData);
                echo "Created gig worker: {$workerData['email']}\n";
            }
        }
    }
}
