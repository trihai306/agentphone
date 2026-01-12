<?php

namespace App\Http\Controllers;

use App\Models\AiCreditPackage;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AiCreditController extends Controller
{
    /**
     * Display AI Credits purchase page
     */
    public function index()
    {
        $user = Auth::user();

        // Get available credit packages
        $packages = AiCreditPackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => $this->formatPackage($pkg));

        // Get user's wallet balance
        $wallet = $user->wallets()->where('currency', 'VND')->first();
        $walletBalance = $wallet ? $wallet->balance : 0;

        return Inertia::render('AiCredits/Index', [
            'packages' => $packages,
            'currentCredits' => $user->ai_credits,
            'walletBalance' => $walletBalance,
        ]);
    }

    /**
     * Get available credit packages (API endpoint)
     */
    public function packages()
    {
        $packages = AiCreditPackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => $this->formatPackage($pkg));

        return response()->json([
            'packages' => $packages,
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
        $package = AiCreditPackage::findOrFail($request->package_id);

        if (!$package->is_active) {
            return back()->withErrors(['package_id' => 'This package is no longer available']);
        }

        // Currently only wallet payment is supported
        if ($request->payment_method === 'wallet') {
            return $this->purchaseWithWallet($user, $package);
        }

        return back()->withErrors(['payment_method' => 'Invalid payment method']);
    }

    /**
     * Purchase credits using wallet balance
     */
    protected function purchaseWithWallet(User $user, AiCreditPackage $package)
    {
        $wallet = $user->wallets()->where('currency', 'VND')->first();

        // Validate balance
        if (!$wallet || $wallet->balance < $package->price) {
            return back()->withErrors([
                'payment_method' => 'Insufficient wallet balance. Please top up your wallet first.'
            ]);
        }

        // Deduct from wallet
        $wallet->balance -= $package->price;
        $wallet->save();

        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'type' => Transaction::TYPE_WITHDRAWAL,
            'amount' => $package->price,
            'final_amount' => $package->price,
            'status' => Transaction::STATUS_COMPLETED,
            'payment_method' => 'wallet',
            'user_note' => "Purchased {$package->name} ({$package->credits} AI credits)",
            'completed_at' => now(),
        ]);

        // Add credits to user
        $user->addAiCredits($package->credits);

        return redirect()->route('ai-credits.index')
            ->with('success', "Successfully purchased {$package->credits} AI credits!");
    }

    /**
     * Get credit purchase history
     */
    public function history()
    {
        $user = Auth::user();

        $history = Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->where('payment_method', 'wallet')
            ->whereNotNull('ai_generation_id')
            ->orWhere(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->where('user_note', 'like', '%AI credits%');
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('AiCredits/History', [
            'history' => $history,
        ]);
    }

    /**
     * Format package for frontend
     */
    protected function formatPackage(AiCreditPackage $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'description' => $package->description,
            'credits' => $package->credits,
            'price' => (float) $package->price,
            'original_price' => $package->original_price ? (float) $package->original_price : null,
            'currency' => $package->currency,
            'is_featured' => $package->is_featured,
            'badge' => $package->badge,
            'badge_color' => $package->badge_color,
            'discount_percent' => $package->discount_percent,
            'formatted_price' => $package->formatted_price,
            'formatted_original_price' => $package->formatted_original_price,
            'price_per_credit' => round($package->price_per_credit, 2),
        ];
    }
}
