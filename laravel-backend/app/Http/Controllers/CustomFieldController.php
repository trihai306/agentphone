<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomFieldRequest;
use App\Models\UserCustomField;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomFieldController extends Controller
{
    /**
     * Store a new custom field
     */
    public function store(CustomFieldRequest $request)
    {
        $request->user()->customFields()->create([
            'name' => $request->name,
            'key' => Str::slug($request->name),
            'type' => $request->type,
            'options' => $request->options,
            'description' => $request->description,
            'validation_rules' => $request->validation_rules,
            'visibility' => $request->visibility ?? UserCustomField::VISIBILITY_PRIVATE,
            'is_searchable' => $request->is_searchable ?? false,
            'order' => $request->user()->customFields()->max('order') + 1,
        ]);

        return back()->with('success', 'Trường tùy chỉnh đã được tạo thành công!');
    }

    /**
     * Update a custom field
     */
    public function update(CustomFieldRequest $request, int $id)
    {
        $field = $request->user()->customFields()->findOrFail($id);

        $field->update([
            'name' => $request->name,
            'key' => Str::slug($request->name),
            'type' => $request->type,
            'options' => $request->options,
            'description' => $request->description,
            'validation_rules' => $request->validation_rules,
            'visibility' => $request->visibility,
            'is_searchable' => $request->is_searchable,
        ]);

        return back()->with('success', 'Trường tùy chỉnh đã được cập nhật!');
    }

    /**
     * Delete a custom field
     */
    public function destroy(Request $request, int $id)
    {
        $field = $request->user()->customFields()->findOrFail($id);
        $field->delete();

        return back()->with('success', 'Trường tùy chỉnh đã được xóa!');
    }

    /**
     * Update field value
     */
    public function updateValue(Request $request, int $fieldId)
    {
        $field = $request->user()->customFields()->findOrFail($fieldId);

        // Build dynamic validation rules
        $rules = [
            'value' => array_merge(
                ['required'],
                $field->validation_rules ?? []
            )
        ];

        $request->validate($rules);

        $request->user()->customFieldValues()->updateOrCreate(
            ['user_custom_field_id' => $field->id],
            ['value' => $request->value]
        );

        return back()->with('success', 'Giá trị đã được cập nhật!');
    }

    /**
     * Reorder custom fields
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|exists:user_custom_fields,id',
            'fields.*.order' => 'required|integer|min:0',
        ]);

        foreach ($request->fields as $fieldData) {
            $request->user()
                ->customFields()
                ->where('id', $fieldData['id'])
                ->update(['order' => $fieldData['order']]);
        }

        return back()->with('success', 'Thứ tự trường đã được cập nhật!');
    }
}
