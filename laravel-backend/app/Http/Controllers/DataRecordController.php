<?php

namespace App\Http\Controllers;

use App\Models\DataCollection;
use App\Services\DataRecordService;
use Illuminate\Http\Request;

class DataRecordController extends Controller
{
    public function __construct(
        protected DataRecordService $dataRecordService
    ) {
    }

    /**
     * Store a new record in collection
     */
    public function store(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        $rules = $this->dataRecordService->buildValidationRules($dataCollection);
        $validated = $request->validate($rules);

        $this->dataRecordService->createRecord($dataCollection, $validated['data']);

        return back()->with('success', 'Record added successfully!');
    }

    /**
     * Update the specified record
     */
    public function update(Request $request, DataCollection $dataCollection, $record)
    {
        $this->authorize('update', $dataCollection);

        $dataRecord = $this->dataRecordService->getRecord($dataCollection, $record);

        if (!$dataRecord) {
            abort(404);
        }

        $rules = $this->dataRecordService->buildValidationRules($dataCollection);
        $validated = $request->validate($rules);

        $this->dataRecordService->updateRecord($dataRecord, $validated['data']);

        return back()->with('success', 'Record updated successfully!');
    }

    /**
     * Remove the specified record
     */
    public function destroy(DataCollection $dataCollection, $record)
    {
        $this->authorize('update', $dataCollection);

        $dataRecord = $this->dataRecordService->getRecord($dataCollection, $record);

        if (!$dataRecord) {
            abort(404);
        }

        $this->dataRecordService->deleteRecord($dataRecord);

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

        $deleted = $this->dataRecordService->bulkDeleteRecords($dataCollection, $validated['ids']);

        return back()->with('success', "{$deleted} records deleted successfully!");
    }
}
