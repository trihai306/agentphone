<?php

namespace App\Http\Controllers;

use App\Models\DataCollection;
use App\Models\DataRecord;
use Illuminate\Http\Request;

class DataRecordController extends Controller
{
    /**
     * Store a new record in collection
     */
    public function store(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        // Validate against collection schema
        $rules = [];
        foreach ($dataCollection->schema as $field) {
            $fieldName = "data.{$field['name']}";
            $fieldRules = [];

            if ($field['required'] ?? false) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            switch ($field['type']) {
                case 'email':
                    $fieldRules[] = 'email';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                case 'boolean':
                    $fieldRules[] = 'boolean';
                    break;
                case 'select':
                    if (isset($field['options'])) {
                        $fieldRules[] = 'in:' . implode(',', $field['options']);
                    }
                    break;
            }

            $rules[$fieldName] = implode('|', $fieldRules);
        }

        $validated = $request->validate($rules);

        $record = $dataCollection->records()->create([
            'data' => $validated['data'],
            'status' => 'active',
        ]);

        return back()->with('success', 'Record added successfully!');
    }

    /**
     * Update the specified record
     */
    public function update(Request $request, DataCollection $dataCollection, $record)
    {
        $this->authorize('update', $dataCollection);

        $dataRecord = $dataCollection->records()->findOrFail($record);

        // Validate against schema
        $rules = [];
        foreach ($dataCollection->schema as $field) {
            $fieldName = "data.{$field['name']}";
            $fieldRules = [];

            if ($field['required'] ?? false) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            switch ($field['type']) {
                case 'email':
                    $fieldRules[] = 'email';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                case 'boolean':
                    $fieldRules[] = 'boolean';
                    break;
                case 'select':
                    if (isset($field['options'])) {
                        $fieldRules[] = 'in:' . implode(',', $field['options']);
                    }
                    break;
            }

            $rules[$fieldName] = implode('|', $fieldRules);
        }

        $validated = $request->validate($rules);

        $dataRecord->update([
            'data' => $validated['data'],
        ]);

        return back()->with('success', 'Record updated successfully!');
    }

    /**
     * Remove the specified record
     */
    public function destroy(DataCollection $dataCollection, $record)
    {
        $this->authorize('update', $dataCollection);

        $dataRecord = $dataCollection->records()->findOrFail($record);
        $dataRecord->delete();

        return back()->with('success', 'Record deleted successfully!');
    }

    /**
     * Bulk delete records
     */
    public function bulkDelete(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:data_records,id',
        ]);

        $dataCollection->records()->whereIn('id', $validated['ids'])->delete();

        return back()->with('success', count($validated['ids']) . ' records deleted successfully!');
    }
}
