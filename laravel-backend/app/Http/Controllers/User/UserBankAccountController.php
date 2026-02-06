<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserBankAccount;
use App\Services\BankAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserBankAccountController extends Controller
{
    public function __construct(
        protected BankAccountService $bankAccountService
    ) {
    }

    public function index()
    {
        $user = Auth::user();

        return Inertia::render('BankAccounts/Index', [
            'bankAccounts' => $this->bankAccountService->getBankAccountsForUser($user),
            'banks' => $this->bankAccountService->getActiveBanks(),
        ]);
    }

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

        if ($this->bankAccountService->accountExists($user, $request->bank_id, $request->account_number)) {
            return back()->withErrors(['account_number' => 'Tài khoản này đã được thêm']);
        }

        $this->bankAccountService->createBankAccount($user, $request->all());

        return back()->with('success', 'Đã thêm tài khoản ngân hàng');
    }

    public function update(Request $request, UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if (!$this->bankAccountService->verifyOwnership($bankAccount, $user)) {
            abort(403);
        }

        $request->validate([
            'account_name' => 'required|string|max:100',
            'branch' => 'nullable|string|max:100',
        ]);

        $this->bankAccountService->updateBankAccount($bankAccount, $request->all());

        return back()->with('success', 'Đã cập nhật tài khoản');
    }

    public function destroy(UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if (!$this->bankAccountService->verifyOwnership($bankAccount, $user)) {
            abort(403);
        }

        if (!$this->bankAccountService->canDeleteBankAccount($bankAccount)) {
            return back()->withErrors(['error' => 'Không thể xóa tài khoản đang có giao dịch chờ xử lý']);
        }

        $this->bankAccountService->deleteBankAccount($bankAccount);

        return back()->with('success', 'Đã xóa tài khoản ngân hàng');
    }

    public function setDefault(UserBankAccount $bankAccount)
    {
        $user = Auth::user();

        if (!$this->bankAccountService->verifyOwnership($bankAccount, $user)) {
            abort(403);
        }

        $this->bankAccountService->setDefaultBankAccount($bankAccount);

        return back()->with('success', 'Đã đặt làm tài khoản mặc định');
    }
}
