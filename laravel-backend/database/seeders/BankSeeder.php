<?php

namespace Database\Seeders;

use App\Models\Bank;
use Illuminate\Database\Seeder;

class BankSeeder extends Seeder
{
    public function run(): void
    {
        $banks = [
            [
                'code' => 'VCB',
                'short_name' => 'Vietcombank',
                'full_name' => 'Ngân hàng TMCP Ngoại Thương Việt Nam',
                'bin' => '970436',
                'sort_order' => 1,
            ],
            [
                'code' => 'TCB',
                'short_name' => 'Techcombank',
                'full_name' => 'Ngân hàng TMCP Kỹ Thương Việt Nam',
                'bin' => '970407',
                'sort_order' => 2,
            ],
            [
                'code' => 'VTB',
                'short_name' => 'Vietinbank',
                'full_name' => 'Ngân hàng TMCP Công Thương Việt Nam',
                'bin' => '970415',
                'sort_order' => 3,
            ],
            [
                'code' => 'BIDV',
                'short_name' => 'BIDV',
                'full_name' => 'Ngân hàng TMCP Đầu Tư và Phát Triển Việt Nam',
                'bin' => '970418',
                'sort_order' => 4,
            ],
            [
                'code' => 'ACB',
                'short_name' => 'ACB',
                'full_name' => 'Ngân hàng TMCP Á Châu',
                'bin' => '970416',
                'sort_order' => 5,
            ],
            [
                'code' => 'MB',
                'short_name' => 'MBBank',
                'full_name' => 'Ngân hàng TMCP Quân Đội',
                'bin' => '970422',
                'sort_order' => 6,
            ],
            [
                'code' => 'VPB',
                'short_name' => 'VPBank',
                'full_name' => 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
                'bin' => '970432',
                'sort_order' => 7,
            ],
            [
                'code' => 'TPB',
                'short_name' => 'TPBank',
                'full_name' => 'Ngân hàng TMCP Tiên Phong',
                'bin' => '970423',
                'sort_order' => 8,
            ],
            [
                'code' => 'STB',
                'short_name' => 'Sacombank',
                'full_name' => 'Ngân hàng TMCP Sài Gòn Thương Tín',
                'bin' => '970403',
                'sort_order' => 9,
            ],
            [
                'code' => 'HDB',
                'short_name' => 'HDBank',
                'full_name' => 'Ngân hàng TMCP Phát Triển TP.HCM',
                'bin' => '970437',
                'sort_order' => 10,
            ],
            [
                'code' => 'MSB',
                'short_name' => 'MSB',
                'full_name' => 'Ngân hàng TMCP Hàng Hải Việt Nam',
                'bin' => '970426',
                'sort_order' => 11,
            ],
            [
                'code' => 'SHB',
                'short_name' => 'SHB',
                'full_name' => 'Ngân hàng TMCP Sài Gòn - Hà Nội',
                'bin' => '970443',
                'sort_order' => 12,
            ],
            [
                'code' => 'VIB',
                'short_name' => 'VIB',
                'full_name' => 'Ngân hàng TMCP Quốc Tế Việt Nam',
                'bin' => '970441',
                'sort_order' => 13,
            ],
            [
                'code' => 'SEA',
                'short_name' => 'SeABank',
                'full_name' => 'Ngân hàng TMCP Đông Nam Á',
                'bin' => '970440',
                'sort_order' => 14,
            ],
            [
                'code' => 'EIB',
                'short_name' => 'Eximbank',
                'full_name' => 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam',
                'bin' => '970431',
                'sort_order' => 15,
            ],
            [
                'code' => 'OCB',
                'short_name' => 'OCB',
                'full_name' => 'Ngân hàng TMCP Phương Đông',
                'bin' => '970448',
                'sort_order' => 16,
            ],
            [
                'code' => 'LPB',
                'short_name' => 'LienVietPostBank',
                'full_name' => 'Ngân hàng TMCP Bưu Điện Liên Việt',
                'bin' => '970449',
                'sort_order' => 17,
            ],
            [
                'code' => 'VAB',
                'short_name' => 'VietABank',
                'full_name' => 'Ngân hàng TMCP Việt Á',
                'bin' => '970427',
                'sort_order' => 18,
            ],
            [
                'code' => 'NAB',
                'short_name' => 'NamABank',
                'full_name' => 'Ngân hàng TMCP Nam Á',
                'bin' => '970428',
                'sort_order' => 19,
            ],
            [
                'code' => 'PGB',
                'short_name' => 'PGBank',
                'full_name' => 'Ngân hàng TMCP Xăng Dầu Petrolimex',
                'bin' => '970430',
                'sort_order' => 20,
            ],
            [
                'code' => 'VCCB',
                'short_name' => 'VietCapitalBank',
                'full_name' => 'Ngân hàng TMCP Bản Việt',
                'bin' => '970454',
                'sort_order' => 21,
            ],
            [
                'code' => 'SCB',
                'short_name' => 'SCB',
                'full_name' => 'Ngân hàng TMCP Sài Gòn',
                'bin' => '970429',
                'sort_order' => 22,
            ],
            [
                'code' => 'ABB',
                'short_name' => 'ABBank',
                'full_name' => 'Ngân hàng TMCP An Bình',
                'bin' => '970425',
                'sort_order' => 23,
            ],
            [
                'code' => 'BAB',
                'short_name' => 'BacABank',
                'full_name' => 'Ngân hàng TMCP Bắc Á',
                'bin' => '970409',
                'sort_order' => 24,
            ],
            [
                'code' => 'PVB',
                'short_name' => 'PVcomBank',
                'full_name' => 'Ngân hàng TMCP Đại Chúng Việt Nam',
                'bin' => '970412',
                'sort_order' => 25,
            ],
            [
                'code' => 'CAKE',
                'short_name' => 'CAKE by VPBank',
                'full_name' => 'CAKE by VPBank',
                'bin' => '546034',
                'sort_order' => 26,
            ],
            [
                'code' => 'UBANK',
                'short_name' => 'Ubank by VPBank',
                'full_name' => 'Ubank by VPBank',
                'bin' => '546035',
                'sort_order' => 27,
            ],
            [
                'code' => 'TIMO',
                'short_name' => 'Timo by VPBank',
                'full_name' => 'Timo by VPBank',
                'bin' => '963388',
                'sort_order' => 28,
            ],
            [
                'code' => 'VIETA',
                'short_name' => 'VietABank',
                'full_name' => 'Ngân hàng TMCP Việt Á',
                'bin' => '970427',
                'sort_order' => 29,
            ],
            [
                'code' => 'WRB',
                'short_name' => 'WooriBank',
                'full_name' => 'Ngân hàng Woori Việt Nam',
                'bin' => '970457',
                'sort_order' => 30,
            ],
        ];

        foreach ($banks as $bank) {
            Bank::updateOrCreate(
                ['code' => $bank['code']],
                $bank
            );
        }
    }
}
