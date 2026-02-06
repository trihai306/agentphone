<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomFieldRequest;
use App\Services\CustomFieldService;
use Illuminate\Http\Request;

class CustomFieldController extends Controller
{
    public function __construct(
        protected CustomFieldService $customFieldService
    ) {
    }

    public function store(CustomFieldRequest $request)
    {
        $this->customFieldService->createCustomField($request->user(), $request->validated());

        return back()->with('success', 'Trường tùy chỉnh đã được tạo thành công!');
    }

    public function update(CustomFieldRequest $request, int $id)
    {
        $field = $this->customFieldService->getFieldForUser($request->user(), $id);

        if (!$field) {
            abort(404);
        }

        $this->customFieldService->updateCustomField($field, $request->validated());

        return back()->with('success', 'Trường tùy chỉnh đã được cập nhật!');
    }

    public function destroy(Request $request, int $id)
    {
        $field = $this->customFieldService->getFieldForUser($request->user(), $id);

        if (!$field) {
            abort(404);
        }

        $this->customFieldService->deleteCustomField($field);

        return back()->with('success', 'Trường tùy chỉnh đã được xóa!');
    }

    public function updateValue(Request $request, int $fieldId)
    {
        $field = $this->customFieldService->getFieldForUser($request->user(), $fieldId);

        if (!$field) {
            abort(404);
        }

        $rules = $this->customFieldService->buildValidationRules($field);
        $request->validate(['value' => $rules]);

        $this->customFieldService->updateFieldValue($request->user(), $field, $request->value);

        return back()->with('success', 'Giá trị đã được cập nhật!');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|exists:user_custom_fields,id',
            'fields.*.order' => 'required|integer|min:0',
        ]);

        $this->customFieldService->reorderFields($request->user(), $request->fields);

        return back()->with('success', 'Thứ tự trường đã được cập nhật!');
    }
}
