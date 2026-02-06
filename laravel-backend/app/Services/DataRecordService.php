<?php

namespace App\Services;

use App\Models\DataCollection;
use App\Models\DataRecord;

class DataRecordService
{
    /**
     * Build validation rules based on collection schema
     */
    public function buildValidationRules(DataCollection $collection): array
    {
        $rules = [];

        foreach ($collection->schema as $field) {
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

        return $rules;
    }

    /**
     * Create a new record in collection
     */
    public function createRecord(DataCollection $collection, array $data): DataRecord
    {
        return $collection->records()->create([
            'data' => $data,
            'status' => 'active',
        ]);
    }

    /**
     * Get record from collection
     */
    public function getRecord(DataCollection $collection, int $recordId): ?DataRecord
    {
        return $collection->records()->find($recordId);
    }

    /**
     * Update record data
     */
    public function updateRecord(DataRecord $record, array $data): DataRecord
    {
        $record->update([
            'data' => $data,
        ]);

        return $record->fresh();
    }

    /**
     * Delete a record
     */
    public function deleteRecord(DataRecord $record): void
    {
        $record->delete();
    }

    /**
     * Bulk delete records
     */
    public function bulkDeleteRecords(DataCollection $collection, array $ids): int
    {
        return $collection->records()->whereIn('id', $ids)->delete();
    }
}
