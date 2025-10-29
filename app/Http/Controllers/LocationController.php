<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LocationController extends Controller
{
    /**
     * Get list of countries
     */
    public function getCountries()
    {
        // For now, focusing on Philippines as primary market
        return response()->json([
            ['value' => 'Philippines', 'label' => 'Philippines'],
        ]);
    }

    /**
     * Get provinces based on country
     */
    public function getProvinces($country)
    {
        if ($country !== 'Philippines') {
            return response()->json([]);
        }

        // Philippines provinces (major ones for MVP)
        $provinces = [
            'Metro Manila',
            'Cebu',
            'Davao del Sur',
            'Benguet',
            'Cavite',
            'Laguna',
            'Rizal',
            'Bulacan',
            'Pampanga',
            'Batangas',
            'Pangasinan',
            'Iloilo',
            'Negros Occidental',
            'Leyte',
            'Misamis Oriental',
            'Zamboanga del Sur',
        ];

        return response()->json(
            collect($provinces)->map(fn($province) => [
                'value' => $province,
                'label' => $province,
            ])->values()
        );
    }

    /**
     * Get cities based on province
     */
    public function getCities($province)
    {
        $cities = $this->getCitiesByProvince($province);

        return response()->json(
            collect($cities)->map(fn($city) => [
                'value' => $city,
                'label' => $city,
            ])->values()
        );
    }

    /**
     * Get municipalities based on city
     */
    public function getMunicipalities($city)
    {
        $municipalities = $this->getMunicipalitiesByCity($city);

        return response()->json(
            collect($municipalities)->map(fn($municipality) => [
                'value' => $municipality,
                'label' => $municipality,
            ])->values()
        );
    }

    /**
     * Search addresses for auto-suggestion
     */
    public function searchAddress(Request $request)
    {
        $query = $request->input('query');
        
        if (empty($query) || strlen($query) < 3) {
            return response()->json([]);
        }

        // For MVP, return empty array
        // In production, integrate with Google Places API or similar service
        return response()->json([]);
    }

    /**
     * Get cities by province (static data for MVP)
     */
    private function getCitiesByProvince($province)
    {
        $cityData = [
            'Metro Manila' => [
                'Manila',
                'Quezon City',
                'Makati',
                'Taguig',
                'Pasig',
                'Mandaluyong',
                'Marikina',
                'Caloocan',
                'Malabon',
                'Navotas',
                'Valenzuela',
                'Las Piñas',
                'Muntinlupa',
                'Parañaque',
                'Pasay',
                'Pateros',
                'San Juan',
            ],
            'Cebu' => [
                'Cebu City',
                'Mandaue City',
                'Lapu-Lapu City',
                'Talisay City',
                'Toledo City',
                'Danao City',
                'Carcar City',
                'Naga City',
            ],
            'Davao del Sur' => [
                'Davao City',
                'Digos City',
                'Tagum City',
                'Panabo City',
                'Samal City',
            ],
            'Benguet' => [
                'Baguio City',
                'La Trinidad',
                'Itogon',
                'Tuba',
            ],
            'Cavite' => [
                'Bacoor',
                'Imus',
                'Dasmariñas',
                'General Trias',
                'Cavite City',
                'Tagaytay',
                'Trece Martires',
            ],
            'Laguna' => [
                'Calamba',
                'Biñan',
                'Santa Rosa',
                'San Pedro',
                'Cabuyao',
                'San Pablo',
            ],
        ];

        return $cityData[$province] ?? [];
    }

    /**
     * Get municipalities by city (static data for MVP)
     */
    private function getMunicipalitiesByCity($city)
    {
        // Barangays/municipalities for major cities
        $municipalityData = [
            'Cebu City' => [
                'Lahug',
                'Apas',
                'Kasambagan',
                'Mabolo',
                'Banilad',
                'Guadalupe',
                'Talamban',
                'Pardo',
                'Tisa',
                'Busay',
            ],
            'Lapu-Lapu City' => [
                'Mactan',
                'Marigondon',
                'Basak',
                'Punta Engaño',
                'Agus',
                'Pusok',
                'Gun-ob',
                'Looc',
            ],
            'Quezon City' => [
                'Diliman',
                'Commonwealth',
                'Fairview',
                'Novaliches',
                'Cubao',
                'Tandang Sora',
                'Kamuning',
                'Libis',
            ],
            'Makati' => [
                'Poblacion',
                'Bel-Air',
                'San Lorenzo',
                'Urdaneta',
                'Salcedo Village',
                'Legaspi Village',
                'Magallanes',
            ],
        ];

        return $municipalityData[$city] ?? [];
    }
}



