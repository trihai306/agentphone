<?php

namespace App\Http\Controllers;

use App\Models\ScenarioTemplate;
use Illuminate\Http\Request;

class ScenarioTemplateController extends Controller
{
    /**
     * List all public templates
     */
    public function index(Request $request)
    {
        $query = ScenarioTemplate::public();

        if ($request->category) {
            $query->category($request->category);
        }

        if ($request->free_only) {
            $query->free();
        }

        $templates = $query->orderByDesc('usage_count')->get();

        return response()->json([
            'success' => true,
            'templates' => $templates,
            'categories' => ScenarioTemplate::getCategories(),
        ]);
    }

    /**
     * Get template details
     */
    public function show(ScenarioTemplate $template)
    {
        if (!$template->is_public) {
            abort(404);
        }

        return response()->json([
            'success' => true,
            'template' => $template,
        ]);
    }

    /**
     * Parse template with variables
     */
    public function parse(Request $request, ScenarioTemplate $template)
    {
        $request->validate([
            'variables' => 'required|array',
        ]);

        $parsedScript = $template->parseTemplate($request->variables);

        return response()->json([
            'success' => true,
            'script' => $parsedScript,
            'template' => $template,
        ]);
    }
}
