<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScenarioTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'script_template',
        'default_settings',
        'scene_structure',
        'thumbnail',
        'is_public',
        'is_premium',
        'usage_count',
    ];

    protected $casts = [
        'default_settings' => 'array',
        'scene_structure' => 'array',
        'is_public' => 'boolean',
        'is_premium' => 'boolean',
    ];

    /**
     * Get scenarios created from this template
     */
    public function scenarios(): HasMany
    {
        return $this->hasMany(AiScenario::class, 'template_id');
    }

    /**
     * Scope for public templates
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope for specific category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope for free templates
     */
    public function scopeFree($query)
    {
        return $query->where('is_premium', false);
    }

    /**
     * Increment usage count
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    /**
     * Parse template with variables
     * 
     * @param array $variables Key-value pairs to replace {{placeholders}}
     * @return string
     */
    public function parseTemplate(array $variables): string
    {
        $script = $this->script_template;

        foreach ($variables as $key => $value) {
            $script = str_replace("{{" . $key . "}}", $value, $script);
        }

        return $script;
    }

    /**
     * Get available categories
     */
    public static function getCategories(): array
    {
        return [
            'product' => 'Product Demo',
            'tutorial' => 'Tutorial/How-to',
            'story' => 'Story/Narrative',
            'marketing' => 'Marketing',
            'education' => 'Educational',
            'entertainment' => 'Entertainment',
            'news' => 'News/Updates',
            'testimonial' => 'Testimonial',
        ];
    }
}
