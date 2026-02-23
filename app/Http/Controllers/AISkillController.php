<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AISkillController extends Controller
{
    /**
     * Correct and normalize a skill name using AI (or heuristic for now)
     */
    public function correct(Request $request)
    {
        $request->validate([
            'skill' => 'required|string|max:100',
        ]);

        $skill = trim($request->skill);
        
        // Basic normalization (Capitalize First Letters)
        $normalized = ucwords(strtolower($skill));
        
        // Common typo corrections (Simulating AI) - add variants so typos like "jabascript" get fixed
        $corrections = [
            'pyhton' => 'Python',
            'pythom' => 'Python',
            'javascipt' => 'JavaScript',
            'javascript' => 'JavaScript',
            'jabascript' => 'JavaScript',
            'javasript' => 'JavaScript',
            'javascrpit' => 'JavaScript',
            'javascrip' => 'JavaScript',
            'jaavscript' => 'JavaScript',
            'javasrcipt' => 'JavaScript',
            'reactjs' => 'React',
            'react.js' => 'React',
            'vuejs' => 'Vue.js',
            'node js' => 'Node.js',
            'nodejs' => 'Node.js',
            'php' => 'PHP',
            'html' => 'HTML',
            'htmll' => 'HTML',
            'css' => 'CSS',
            'ui/ux' => 'UI/UX Design',
            'seo' => 'SEO',
            'typescrip' => 'TypeScript',
            'typescript' => 'TypeScript',
            'excel' => 'Microsoft Excel',
            'word' => 'Microsoft Word',
            'powerpoint' => 'Microsoft PowerPoint',
        ];

        $lowerSkill = strtolower($skill);
        if (isset($corrections[$lowerSkill])) {
            $normalized = $corrections[$lowerSkill];
        }

        return response()->json([
            'original' => $skill,
            'corrected' => $normalized
        ]);
    }
}
