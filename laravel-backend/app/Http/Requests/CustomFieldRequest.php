<?php

namespace App\Http\Requests;

use App\Models\UserCustomField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'type' => [
                'required',
                Rule::in([
                    UserCustomField::TYPE_TEXT,
                    UserCustomField::TYPE_NUMBER,
                    UserCustomField::TYPE_DATE,
                    UserCustomField::TYPE_SELECT,
                    UserCustomField::TYPE_MULTI_SELECT,
                    UserCustomField::TYPE_TEXTAREA,
                    UserCustomField::TYPE_URL,
                    UserCustomField::TYPE_EMAIL,
                    UserCustomField::TYPE_PHONE,
                    UserCustomField::TYPE_FILE,
                ]),
            ],
            'options' => 'required_if:type,' . UserCustomField::TYPE_SELECT . ',' . UserCustomField::TYPE_MULTI_SELECT . '|array',
            'options.*' => 'string|max:255',
            'description' => 'nullable|string|max:500',
            'validation_rules' => 'nullable|array',
            'visibility' => 'nullable|in:' . UserCustomField::VISIBILITY_PUBLIC . ',' . UserCustomField::VISIBILITY_PRIVATE,
            'is_searchable' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên trường là bắt buộc.',
            'type.required' => 'Loại trường là bắt buộc.',
            'type.in' => 'Loại trường không hợp lệ.',
            'options.required_if' => 'Tùy chọn là bắt buộc cho loại Select.',
        ];
    }
}
