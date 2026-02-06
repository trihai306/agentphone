<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocaleController extends Controller
{
    public function setLocale(Request $request, string $locale)
    {
        return $this->changeLocale($locale);
    }

    public function setLocaleGet(Request $request, string $locale)
    {
        return $this->changeLocale($locale);
    }

    private function changeLocale(string $locale)
    {
        $availableLocales = ['vi', 'en'];

        if (!in_array($locale, $availableLocales)) {
            return redirect()->back()->with('error', 'Invalid language selected.');
        }

        session(['locale' => $locale]);
        App::setLocale($locale);

        return redirect()->back()
            ->cookie('locale', $locale, 60 * 24 * 30)
            ->with('success', 'Language changed successfully.');
    }
}
