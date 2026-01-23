<?php

namespace App\Http\Controllers;

use App\Models\ScenarioFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScenarioFolderController extends Controller
{
    /**
     * List user's folders
     */
    public function index()
    {
        $user = Auth::user();

        $folders = ScenarioFolder::forUser($user->id)
            ->with(['children', 'scenarios'])
            ->roots()
            ->get();

        return response()->json([
            'success' => true,
            'folders' => $folders,
        ]);
    }

    /**
     * Create folder
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:scenario_folders,id',
            'color' => 'nullable|string|max:7',
        ]);

        $user = Auth::user();

        $folder = ScenarioFolder::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'color' => $request->color ?? '#3b82f6',
        ]);

        return response()->json([
            'success' => true,
            'folder' => $folder->load(['children', 'scenarios']),
        ]);
    }

    /**
     * Update folder
     */
    public function update(Request $request, ScenarioFolder $folder)
    {
        if ($folder->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
        ]);

        $folder->update($request->only(['name', 'description', 'color']));

        return response()->json([
            'success' => true,
            'folder' => $folder,
        ]);
    }

    /**
     * Delete folder
     */
    public function destroy(ScenarioFolder $folder)
    {
        if ($folder->user_id !== Auth::id()) {
            abort(403);
        }

        $folder->delete();

        return response()->json([
            'success' => true,
            'message' => 'Folder deleted',
        ]);
    }
}
