<?php

namespace App\Http\Controllers;

use App\Services\AiCreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Exception;

class AiCreditController extends Controller
{
    public function __construct(
        protected AiCreditService $creditService
    ) {
    }

    /**
     * Display AI Credits purchase page
     */
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('AiCredits/Index', [
            'packages' => $this->creditService->getActivePackages(),
            'currentCredits' => $user->ai_credits,
            'walletBalance' => $this->creditService->getWalletBalance($user),
        ]);
    }

    /**
     * Get available credit packages (API endpoint)
     */
    public function packages()
    {
        return response()->json([
            'packages' => $this->creditService->getActivePackages(),
        ]);
    }

    /**
     * Purchase a credit package
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:ai_credit_packages,id',
            'payment_method' => 'required|in:wallet',
        ]);

        $user = Auth::user();
        $package = $this->creditService->findPackage($request->package_id);

        if (!$package || !$package->is_active) {
            return back()->withErrors(['package_id' => 'This package is no longer available']);
        }

        // Currently only wallet payment is supported
        if ($request->payment_method !== 'wallet') {
            return back()->withErrors(['payment_method' => 'Invalid payment method']);
        }

        try {
            $this->creditService->purchaseWithWallet($user, $package);
            return redirect()->route('ai-credits.index')
                ->with('success', "Successfully purchased {$package->credits} AI credits!");
        } catch (Exception $e) {
            return back()->withErrors(['payment_method' => $e->getMessage()]);
        }
    }

    /**
     * Purchase credits with custom amount
     */
    public function purchaseCustom(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000',
            'credits' => 'required|integer|min:1',
        ]);

        $user = Auth::user();

        try {
            $this->creditService->purchaseCustomCredits(
                $user,
                $validated['amount'],
                $validated['credits']
            );

            return redirect()->route('ai-credits.index')
                ->with('success', "Đã mua {$validated['credits']} credits thành công!");
        } catch (Exception $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    /**
     * Get credit purchase history
     */
    public function history()
    {
        $user = Auth::user();

        return Inertia::render('AiCredits/History', [
            'history' => $this->creditService->getPurchaseHistory($user),
        ]);
    }
}
