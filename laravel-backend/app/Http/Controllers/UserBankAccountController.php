<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\UserBankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserBankAccountController extends Controller
{
    /**
     * Danh sách tài khoản ngân hàng
     */
    public function index()
    {
        $user = Auth::user();

        $bankAccounts = UserBankAccount::where('user_id', $user->id)
            ->with('bank')
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($account) => [
                'id' => $account->id,
                'bank_id' => $account->bank_id,
                'bank_name' => $account->bank?->short_name,
                'bank_full_name' => $account->bank?->full_name,
                'bank_logo' => $account->bank?->logo,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'branch' => $account->branch,
                'is_default' => $account->is_default,
                'is_verified' => $account->is_verified,
                'created_at' => $account->created_at->format('d/m/Y'),
            ]);

        $banks = Bank::active()
            ->ordered()
            ->get()
            ->map(fn($bank) => [
                'id' => $bank->id,
                'code' => $bank->code,
                'short_name' => $bank->short_name,
                'full_name' => $bank->full_name,
                'logo' => $bank->logo,
            ]);

        return Inertia::render('BankAccounts/Index', [
            'bankAccounts' => $bankAccounts,
            'banks' => $banks,
        ]);
    }

    /**
     * Thêm tài khoản ngân hàng
     */
    public function store(Request $request)
    {
        $request->validate([
            'bank_id' => 'required|exists:banks,id',
            'account_number' => 'required|string|max:30',
            'account_name' => 'required|string|max:100',
            'branch' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ], [
            'bank_id.required' => 'Vui lòng chọn ngân hàng',
            'account_number.required' => 'Vui lòng nhập số tài khoản',
            'account_name.required' => 'Vui lòng nhập tên chủ tài khoản',
        ]);

        $user = Auth::user();

        // Kiểm tra xem đã có tài khoản này chưa
        $exists = UserBankAccount::where('user_id', $user->id)
            ->where('bank_id', $request->bank_id)
            ->where('account_number', $request->account_number)
            ->exists();

        if ($exists) {
            return back()->withErrors(['account_number' => 'Tài khoản này đã được thêm']);
        }

        // Nếu đây là tài khoản đầu tiên thì đặt làm mặc định
        $isFirst = !UserBankAccount::where('user_id', $user->id)->exists();

        UserBankAccount::create([
            'user_id' => $user->id,
            'bank_id' => $request->bank_id,
            'account_number' => $request->account_number,
            'account_name' => strtoupper($request->account_name),
            'branch' => $request->branch,
            'is_default' => $isFirst || $request->boolean('is_default'),
        ]);

        return back()->with('success', 'Đã thêm tài khoản ngân hàng');
    }

    /**
     * Cập nhật tài khoản ngân hàng
     */
    public function update(Request $request, UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if ($bankAccount->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'account_name' => 'required|string|max:100',
            'branch' => 'nullable|string|max:100',
        ]);

        $bankAccount->update([
            'account_name' => strtoupper($request->account_name),
            'branch' => $request->branch,
        ]);

        return back()->with('success', 'Đã cập nhật tài khoản');
    }

    /**
     * Xóa tài khoản ngân hàng
     */
    public function destroy(UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if ($bankAccount->user_id !== $user->id) {
            abort(403);
        }

        // Không cho xóa nếu có giao dịch pending
        $hasPendingTransactions = $bankAccount->transactions()
            ->whereIn('status', ['pending', 'processing'])
            ->exists();

        if ($hasPendingTransactions) {
            return back()->withErrors(['error' => 'Không thể xóa tài khoản đang có giao dịch chờ xử lý']);
        }

        $wasDefault = $bankAccount->is_default;
        $bankAccount->delete();

        // Nếu xóa tài khoản mặc định, đặt tài khoản khác làm mặc định
        if ($wasDefault) {
            $newDefault = UserBankAccount::where('user_id', $user->id)->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        return back()->with('success', 'Đã xóa tài khoản ngân hàng');
    }

    /**
     * Đặt làm tài khoản mặc định
     */
    public function setDefault(UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if ($bankAccount->user_id !== $user->id) {
            abort(403);
        }

        // Model boot sẽ tự động bỏ is_default của các tài khoản khác
        $bankAccount->update(['is_default' => true]);

        return back()->with('success', 'Đã đặt làm tài khoản mặc định');
    }
}
