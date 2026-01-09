<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by auth:sanctum middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'device_id' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'android_version' => 'nullable|string|max:50',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'device_id.required' => 'Device ID là bắt buộc.',
            'device_id.string' => 'Device ID phải là chuỗi ký tự.',
            'device_id.max' => 'Device ID không được vượt quá 255 ký tự.',
            'name.string' => 'Tên thiết bị phải là chuỗi ký tự.',
            'name.max' => 'Tên thiết bị không được vượt quá 255 ký tự.',
            'model.string' => 'Model thiết bị phải là chuỗi ký tự.',
            'model.max' => 'Model thiết bị không được vượt quá 255 ký tự.',
            'android_version.string' => 'Phiên bản Android phải là chuỗi ký tự.',
            'android_version.max' => 'Phiên bản Android không được vượt quá 50 ký tự.',
        ];
    }

}
