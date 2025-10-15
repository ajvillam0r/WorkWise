<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Freelancer;
use App\Models\FreelancerExperience;
use App\Models\FreelancerEducation;
use App\Models\FreelancerSkill;
use App\Models\Skill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class FreelancerProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create comprehensive freelancer profiles with all sections populated
        $freelancers = [
            [
                'user' => [
                    'first_name' => 'Maria',
                    'last_name' => 'Santos',
                    'email' => 'maria.santos@freelancer.ph',
                    'password' => Hash::make('password123'),
                    'user_type' => 'gig_worker',
                    'profile_completed' => true,
                    'profile_status' => 'active',
                ],
                'profile' => [
                    'professional_title' => 'Senior Full-Stack Developer',
                    'bio' => 'Experienced full-stack developer with 8+ years of expertise in building scalable web applications. Specialized in Laravel, React, and cloud technologies. Passionate about creating efficient solutions for Filipino businesses.',
                    'location' => 'Makati City, Metro Manila',
                    'phone' => '+639171234567',
                    'hourly_rate' => 1200.00,
                    'years_of_experience' => 8,
                    'availability_status' => 'available',
                    'portfolio_url' => 'https://mariasantos.dev',
                    'linkedin_url' => 'https://linkedin.com/in/mariasantos',
                    'github_url' => 'https://github.com/mariasantos',
                    'languages_spoken' => json_encode(['English', 'Filipino', 'Spanish']),
                    'timezone' => 'Asia/Manila',
                    'profile_completion_percentage' => 95,
                ],
                'experiences' => [
                    [
                        'company_name' => 'TechCorp Philippines',
                        'job_title' => 'Senior Full-Stack Developer',
                        'employment_type' => 'full-time',
                        'start_date' => '2020-01-15',
                        'end_date' => null,
                        'is_current' => true,
                        'description' => 'Lead development of enterprise web applications using Laravel and React. Managed a team of 5 developers and implemented CI/CD pipelines.',
                        'location' => 'Makati City, Metro Manila',
                        'skills_used' => json_encode(['Laravel', 'React', 'MySQL', 'AWS', 'Docker']),
                    ],
                    [
                        'company_name' => 'StartupHub Manila',
                        'job_title' => 'Full-Stack Developer',
                        'employment_type' => 'full-time',
                        'start_date' => '2018-03-01',
                        'end_date' => '2019-12-31',
                        'is_current' => false,
                        'description' => 'Developed multiple SaaS applications from scratch. Worked with modern JavaScript frameworks and PHP backends.',
                        'location' => 'Taguig City, Metro Manila',
                        'skills_used' => json_encode(['PHP', 'Vue.js', 'PostgreSQL', 'Redis']),
                    ],
                ],
                'educations' => [
                    [
                        'institution_name' => 'University of the Philippines Diliman',
                        'degree_type' => 'Bachelor of Science',
                        'field_of_study' => 'Computer Science',
                        'start_date' => '2012-06-01',
                        'end_date' => '2016-04-30',
                        'is_current' => false,
                        'gpa' => 3.8,
                        'description' => 'Graduated Magna Cum Laude. Specialized in software engineering and database systems.',
                    ],
                ],
                'skills' => [
                    ['name' => 'Laravel', 'proficiency_level' => 'expert', 'years_of_experience' => 6, 'last_used' => '2024-01-15', 'projects_completed' => 25, 'average_rating' => 4.9, 'hourly_rate' => 1200.00],
                    ['name' => 'React', 'proficiency_level' => 'expert', 'years_of_experience' => 5, 'last_used' => '2024-01-14', 'projects_completed' => 20, 'average_rating' => 4.8, 'hourly_rate' => 1100.00],
                    ['name' => 'PHP', 'proficiency_level' => 'expert', 'years_of_experience' => 8, 'last_used' => '2024-01-15', 'projects_completed' => 35, 'average_rating' => 4.9, 'hourly_rate' => 1000.00],
                    ['name' => 'MySQL', 'proficiency_level' => 'advanced', 'years_of_experience' => 7, 'last_used' => '2024-01-10', 'projects_completed' => 30, 'average_rating' => 4.7, 'hourly_rate' => 900.00],
                    ['name' => 'AWS', 'proficiency_level' => 'advanced', 'years_of_experience' => 4, 'last_used' => '2024-01-12', 'projects_completed' => 15, 'average_rating' => 4.6, 'hourly_rate' => 1300.00],
                ],
            ],
            [
                'user' => [
                    'first_name' => 'John',
                    'last_name' => 'Dela Cruz',
                    'email' => 'john.delacruz@designer.ph',
                    'password' => Hash::make('password123'),
                    'user_type' => 'gig_worker',
                    'profile_completed' => true,
                    'profile_status' => 'active',
                ],
                'profile' => [
                    'professional_title' => 'UI/UX Designer & Frontend Developer',
                    'bio' => 'Creative UI/UX designer with strong frontend development skills. 5+ years of experience creating beautiful, user-centered designs for web and mobile applications.',
                    'location' => 'Quezon City, Metro Manila',
                    'phone' => '+639181234567',
                    'hourly_rate' => 800.00,
                    'years_of_experience' => 5,
                    'availability_status' => 'available',
                    'portfolio_url' => 'https://johndelacruz.design',
                    'linkedin_url' => 'https://linkedin.com/in/johndelacruz',
                    'website' => 'https://behance.net/johndelacruz',
                    'languages_spoken' => json_encode(['English', 'Filipino']),
                    'timezone' => 'Asia/Manila',
                    'profile_completion_percentage' => 88,
                ],
                'experiences' => [
                    [
                        'company_name' => 'Creative Agency Manila',
                        'job_title' => 'Senior UI/UX Designer',
                        'employment_type' => 'full-time',
                        'start_date' => '2021-02-01',
                        'end_date' => null,
                        'is_current' => true,
                        'description' => 'Lead designer for multiple client projects. Specialized in e-commerce and fintech applications.',
                        'location' => 'Makati City, Metro Manila',
                        'skills_used' => json_encode(['Figma', 'Adobe XD', 'React', 'CSS', 'JavaScript']),
                    ],
                ],
                'educations' => [
                    [
                        'institution_name' => 'De La Salle University',
                        'degree_type' => 'Bachelor of Fine Arts',
                        'field_of_study' => 'Multimedia Arts',
                        'start_date' => '2015-06-01',
                        'end_date' => '2019-04-30',
                        'is_current' => false,
                        'gpa' => 3.6,
                        'description' => 'Focused on digital design and interactive media.',
                    ],
                ],
                'skills' => [
                    ['name' => 'UI/UX Design', 'proficiency_level' => 'expert', 'years_of_experience' => 5, 'last_used' => '2024-01-15', 'projects_completed' => 40, 'average_rating' => 4.8, 'hourly_rate' => 800.00],
                    ['name' => 'Figma', 'proficiency_level' => 'expert', 'years_of_experience' => 4, 'last_used' => '2024-01-15', 'projects_completed' => 35, 'average_rating' => 4.9, 'hourly_rate' => 750.00],
                    ['name' => 'React', 'proficiency_level' => 'intermediate', 'years_of_experience' => 3, 'last_used' => '2024-01-10', 'projects_completed' => 12, 'average_rating' => 4.5, 'hourly_rate' => 900.00],
                    ['name' => 'CSS', 'proficiency_level' => 'advanced', 'years_of_experience' => 5, 'last_used' => '2024-01-14', 'projects_completed' => 30, 'average_rating' => 4.7, 'hourly_rate' => 600.00],
                ],
            ],
            [
                'user' => [
                    'first_name' => 'Ana',
                    'last_name' => 'Reyes',
                    'email' => 'ana.reyes@writer.ph',
                    'password' => Hash::make('password123'),
                    'user_type' => 'gig_worker',
                    'profile_completed' => true,
                    'profile_status' => 'active',
                ],
                'profile' => [
                    'professional_title' => 'Content Writer & Digital Marketing Specialist',
                    'bio' => 'Professional content writer and digital marketing specialist with 4+ years of experience. Expert in SEO writing, social media content, and marketing campaigns.',
                    'location' => 'Cebu City, Cebu',
                    'phone' => '+639191234567',
                    'hourly_rate' => 500.00,
                    'years_of_experience' => 4,
                    'availability_status' => 'available',
                    'portfolio_url' => 'https://anareyes.writer',
                    'linkedin_url' => 'https://linkedin.com/in/anareyes',
                    'languages_spoken' => json_encode(['English', 'Filipino', 'Cebuano']),
                    'timezone' => 'Asia/Manila',
                    'profile_completion_percentage' => 92,
                ],
                'experiences' => [
                    [
                        'company_name' => 'Digital Marketing Hub',
                        'job_title' => 'Senior Content Writer',
                        'employment_type' => 'freelance',
                        'start_date' => '2020-06-01',
                        'end_date' => null,
                        'is_current' => true,
                        'description' => 'Create engaging content for various clients across different industries. Specialize in SEO-optimized articles and social media campaigns.',
                        'location' => 'Remote',
                        'skills_used' => json_encode(['Content Writing', 'SEO', 'Social Media Marketing', 'WordPress']),
                    ],
                ],
                'educations' => [
                    [
                        'institution_name' => 'University of San Carlos',
                        'degree_type' => 'Bachelor of Arts',
                        'field_of_study' => 'Mass Communication',
                        'start_date' => '2016-06-01',
                        'end_date' => '2020-04-30',
                        'is_current' => false,
                        'gpa' => 3.7,
                        'description' => 'Specialized in journalism and digital media.',
                    ],
                ],
                'skills' => [
                    ['name' => 'Content Writing', 'proficiency_level' => 'expert', 'years_of_experience' => 4, 'last_used' => '2024-01-15', 'projects_completed' => 150, 'average_rating' => 4.9, 'hourly_rate' => 500.00],
                    ['name' => 'SEO', 'proficiency_level' => 'advanced', 'years_of_experience' => 3, 'last_used' => '2024-01-14', 'projects_completed' => 80, 'average_rating' => 4.7, 'hourly_rate' => 600.00],
                    ['name' => 'Social Media Marketing', 'proficiency_level' => 'advanced', 'years_of_experience' => 4, 'last_used' => '2024-01-13', 'projects_completed' => 60, 'average_rating' => 4.8, 'hourly_rate' => 550.00],
                ],
            ],
        ];

        foreach ($freelancers as $freelancerData) {
            // Create user
            $user = User::create($freelancerData['user']);
            
            // Create freelancer profile
            $freelancer = Freelancer::create(array_merge(
                ['user_id' => $user->id],
                $freelancerData['profile']
            ));

            // Create experiences
            foreach ($freelancerData['experiences'] as $experienceData) {
                FreelancerExperience::create(array_merge(
                    ['freelancer_id' => $freelancer->id],
                    $experienceData
                ));
            }

            // Create educations
            foreach ($freelancerData['educations'] as $educationData) {
                FreelancerEducation::create(array_merge(
                    ['freelancer_id' => $freelancer->id],
                    $educationData
                ));
            }

            // Create skills
            foreach ($freelancerData['skills'] as $skillData) {
                // Find or create the skill
                $skill = \App\Models\Skill::findOrCreateByName($skillData['name']);

                // Create freelancer skill
                FreelancerSkill::create([
                    'freelancer_id' => $freelancer->id,
                    'skill_id' => $skill->id,
                    'proficiency_level' => $skillData['proficiency_level'],
                    'years_of_experience' => $skillData['years_of_experience'],
                    'is_featured' => $skillData['is_featured'] ?? false,
                    'display_order' => $skillData['display_order'] ?? 0,
                ]);
            }
        }
    }
}