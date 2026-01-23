<?php

namespace Database\Seeders;

use App\Models\ScenarioTemplate;
use Illuminate\Database\Seeder;

class ScenarioTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Product Demo
            [
                'name' => 'Product Launch',
                'description' => 'Professional product launch video with cinematic quality',
                'category' => 'product',
                'script_template' => "Scene 1: Opening shot of {{product_name}} in {{setting}}, dramatic lighting, shallow depth of field\n\nScene 2: Close-up of key feature - {{main_feature}}, smooth camera movement, highlight the innovation\n\nScene 3: Product in action - {{use_case}}, dynamic angles, real-world environment\n\nScene 4: Call to action - {{product_name}} logo with {{tagline}}, clean minimalist background",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 4, 'type' => 'hero'],
                    ['order' => 2, 'duration' => 5, 'type' => 'feature'],
                    ['order' => 3, 'duration' => 5, 'type' => 'demo'],
                    ['order' => 4, 'duration' => 3, 'type' => 'cta'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '16:9',
                    'style' => 'cinematic',
                ],
            ],

            // Tutorial
            [
                'name' => 'Step-by-Step Tutorial',
                'description' => 'Educational tutorial with clear visual instructions',
                'category' => 'tutorial',
                'script_template' => "Scene 1: Introduction - The problem: {{problem_description}}, frustrated user, relatable scenario\n\nScene 2: Solution overview - {{solution_name}} interface, clean and modern design, easy to understand\n\nScene 3: Step 1 - {{step_1}}, highlight the action, smooth transitions\n\nScene 4: Step 2 - {{step_2}}, detailed view, professional execution\n\nScene 5: Step 3 - {{step_3}}, final touches, polished result\n\nScene 6: Result - {{final_result}}, happy user, successful outcome",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 3, 'type' => 'intro'],
                    ['order' => 2, 'duration' => 4, 'type' => 'overview'],
                    ['order' => 3, 'duration' => 5, 'type' => 'step'],
                    ['order' => 4, 'duration' => 5, 'type' => 'step'],
                    ['order' => 5, 'duration' => 5, 'type' => 'step'],
                    ['order' => 6, 'duration' => 3, 'type' => 'result'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '16:9',
                    'style' => 'clean',
                ],
            ],

            // Story/Narrative
            [
                'name' => 'Brand Story',
                'description' => 'Emotional brand storytelling with cinematic narrative',
                'category' => 'story',
                'script_template' => "Scene 1: Opening - {{setting_description}}, establish mood with lighting and composition, cinematic wide shot\n\nScene 2: Character introduction - {{character_description}}, intimate close-up, natural lighting, authentic emotion\n\nScene 3: Journey begins - {{journey_start}}, dynamic movement, montage style, inspirational music\n\nScene 4: Challenge/Conflict - {{challenge}}, dramatic tension, low-key lighting, intense atmosphere\n\nScene 5: Resolution - {{solution}}, uplifting visuals, bright colors, redemption arc\n\nScene 6: Closing message - {{brand_message}}, elegant typography, memorable tagline",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 4, 'type' => 'opening'],
                    ['order' => 2, 'duration' => 4, 'type' => 'character'],
                    ['order' => 3, 'duration' => 5, 'type' => 'journey'],
                    ['order' => 4, 'duration' => 4, 'type' => 'conflict'],
                    ['order' => 5, 'duration' => 5, 'type' => 'resolution'],
                    ['order' => 6, 'duration' => 3, 'type' => 'closing'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '16:9',
                    'style' => 'cinematic',
                ],
            ],

            // Marketing/Promo
            [
                'name' => 'Social Media Promo',
                'description' => 'Fast-paced promotional video for social media platforms',
                'category' => 'marketing',
                'script_template' => "Scene 1: Attention grabber - {{hook}}, vibrant colors, quick cut, eye-catching visuals\n\nScene 2: Value proposition - {{main_benefit}}, bold text overlay, energetic pacing\n\nScene 3: Social proof - {{testimonial_visual}}, authentic users, real results\n\nScene 4: Limited time offer - {{offer_details}}, urgency elements, countdown timer\n\nScene 5: Clear CTA - {{call_to_action}}, prominent button, contrasting colors",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 3, 'type' => 'hook'],
                    ['order' => 2, 'duration' => 4, 'type' => 'value'],
                    ['order' => 3, 'duration' => 4, 'type' => 'proof'],
                    ['order' => 4, 'duration' => 3, 'type' => 'offer'],
                    ['order' => 5, 'duration' => 3, 'type' => 'cta'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '9:16',
                    'style' => 'modern',
                ],
            ],

            // Testimonial
            [
                'name' => 'Customer Testimonial',
                'description' => 'Authentic customer success story with emotional impact',
                'category' => 'testimonial',
                'script_template' => "Scene 1: Customer introduction - {{customer_name}} in their environment, natural lighting, documentary style\n\nScene 2: The problem - {{problem_faced}}, relatable struggle, empathetic tone\n\nScene 3: Discovery - {{how_found_solution}}, moment of hope, transition to brighter visuals\n\nScene 4: Transformation - {{results_achieved}}, before/after comparison, impressive metrics\n\nScene 5: Recommendation - {{personal_recommendation}}, genuine expression, direct to camera",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 4, 'type' => 'intro'],
                    ['order' => 2, 'duration' => 4, 'type' => 'problem'],
                    ['order' => 3, 'duration' => 4, 'type' => 'discovery'],
                    ['order' => 4, 'duration' => 5, 'type' => 'results'],
                    ['order' => 5, 'duration' => 4, 'type' => 'recommendation'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '16:9',
                    'style' => 'documentary',
                ],
            ],

            // Educational
            [
                'name' => 'Educational Explainer',
                'description' => 'Clear and engaging explanation of complex concepts',
                'category' => 'education',
                'script_template' => "Scene 1: Question - {{main_question}}, intriguing visual, spark curiosity\n\nScene 2: Context - {{background_info}}, infographic style, clean animations\n\nScene 3: Explanation Part 1 - {{concept_1}}, visual metaphor, easy to understand\n\nScene 4: Explanation Part 2 - {{concept_2}}, diagram or chart, professional presentation\n\nScene 5: Real-world example - {{practical_example}}, relatable scenario, concrete application\n\nScene 6: Summary - {{key_takeaway}}, memorable visual, strong conclusion",
                'scene_structure' => [
                    ['order' => 1, 'duration' => 3, 'type' => 'question'],
                    ['order' => 2, 'duration' => 4, 'type' => 'context'],
                    ['order' => 3, 'duration' => 5, 'type' => 'explain'],
                    ['order' => 4, 'duration' => 5, 'type' => 'explain'],
                    ['order' => 5, 'duration' => 4, 'type' => 'example'],
                    ['order' => 6, 'duration' => 3, 'type' => 'summary'],
                ],
                'default_settings' => [
                    'resolution' => '1080p',
                    'aspect_ratio' => '16:9',
                    'style' => 'clean',
                ],
            ],
        ];

        foreach ($templates as $template) {
            ScenarioTemplate::create($template);
        }
    }
}
