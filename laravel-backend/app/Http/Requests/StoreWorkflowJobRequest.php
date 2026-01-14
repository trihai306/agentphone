<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkflowJobRequest extends FormRequest
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
            'flow_id' => 'required|exists:flows,id',
            'device_id' => 'required|exists:devices,id',
            'data_collection_id' => 'nullable|exists:data_collections,id',
            'data_record_ids' => 'nullable|array',
            'data_record_ids.*' => 'integer|exists:data_records,id',
            'record_limit' => 'nullable|integer|min:1',
            'execution_mode' => 'nullable|in:sequential,parallel',
            'config' => 'nullable|array',
            'priority' => 'nullable|integer|min:1|max:10',
            'scheduled_at' => 'nullable|date|after:now',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Tên job là bắt buộc.',
            'flow_id.required' => 'Vui lòng chọn workflow.',
            'flow_id.exists' => 'Workflow không tồn tại.',
            'device_id.required' => 'Vui lòng chọn thiết bị.',
            'device_id.exists' => 'Thiết bị không tồn tại.',
            'priority.min' => 'Độ ưu tiên phải từ 1-10.',
            'priority.max' => 'Độ ưu tiên phải từ 1-10.',
            'scheduled_at.after' => 'Thời gian hẹn phải trong tương lai.',
        ];
    }
}
