<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDataCollectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:7',
            'schema' => 'required|array',
            'schema.*.name' => 'required|string',
            'schema.*.type' => 'required|string|in:text,number,email,date,boolean,select,textarea,url,phone,currency,rating,autonumber',
            'schema.*.required' => 'boolean',
            'schema.*.default' => 'nullable',
            'schema.*.options' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Tên collection là bắt buộc.',
            'schema.required' => 'Schema là bắt buộc.',
            'schema.*.name.required' => 'Tên trường là bắt buộc.',
            'schema.*.type.required' => 'Loại trường là bắt buộc.',
            'schema.*.type.in' => 'Loại trường không hợp lệ.',
        ];
    }
}
