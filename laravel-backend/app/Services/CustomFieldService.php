<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserCustomField;
use Illuminate\Support\Str;

class CustomFieldService
{
    /**
     * Create a new custom field for user
     */
    public function createCustomField(User $user, array $data): UserCustomField
    {
        return $user->customFields()->create([
            'name' => $data['name'],
            'key' => Str::slug($data['name']),
            'type' => $data['type'],
            'options' => $data['options'] ?? null,
            'description' => $data['description'] ?? null,
            'validation_rules' => $data['validation_rules'] ?? null,
            'visibility' => $data['visibility'] ?? UserCustomField::VISIBILITY_PRIVATE,
            'is_searchable' => $data['is_searchable'] ?? false,
            'order' => $user->customFields()->max('order') + 1,
        ]);
    }

    /**
     * Update custom field
     */
    public function updateCustomField(UserCustomField $field, array $data): UserCustomField
    {
        $field->update([
            'name' => $data['name'],
            'key' => Str::slug($data['name']),
            'type' => $data['type'],
            'options' => $data['options'] ?? null,
            'description' => $data['description'] ?? null,
            'validation_rules' => $data['validation_rules'] ?? null,
            'visibility' => $data['visibility'] ?? $field->visibility,
            'is_searchable' => $data['is_searchable'] ?? $field->is_searchable,
        ]);

        return $field->fresh();
    }

    /**
     * Delete custom field
     */
    public function deleteCustomField(UserCustomField $field): void
    {
        $field->delete();
    }

    /**
     * Get custom field for user by ID
     */
    public function getFieldForUser(User $user, int $fieldId): ?UserCustomField
    {
        return $user->customFields()->find($fieldId);
    }

    /**
     * Build validation rules for a custom field
     */
    public function buildValidationRules(UserCustomField $field): array
    {
        return array_merge(
            ['required'],
            $field->validation_rules ?? []
        );
    }

    /**
     * Update custom field value
     */
    public function updateFieldValue(User $user, UserCustomField $field, $value): void
    {
        $user->customFieldValues()->updateOrCreate(
            ['user_custom_field_id' => $field->id],
            ['value' => $value]
        );
    }

    /**
     * Reorder custom fields
     */
    public function reorderFields(User $user, array $fields): void
    {
        foreach ($fields as $fieldData) {
            $user->customFields()
                ->where('id', $fieldData['id'])
                ->update(['order' => $fieldData['order']]);
        }
    }
}
