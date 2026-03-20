<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceFactory extends Factory
{
    protected $model = Device::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'device_id' => $this->faker->uuid(),
            'name' => $this->faker->randomElement(['Samsung Galaxy S24', 'Pixel 8 Pro', 'OnePlus 12', 'Xiaomi 14']),
            'model' => $this->faker->randomElement(['SM-S921B', 'Pixel 8 Pro', 'CPH2581', 'M14']),
            'android_version' => $this->faker->randomElement(['13', '14', '15']),
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => Device::STATUS_INACTIVE,
        ]);
    }
}
