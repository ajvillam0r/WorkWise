@component('mail::message')
# Your ID Has Been Verified! ✅

Hi {{ $user->first_name }},

Great news! Your identification document has been successfully verified by our team.

@component('mail::panel')
**✅ ID Verification Status:** Approved

**ID Type:** {{ $user->id_type_label ?? $user->id_type }}  
**Verified On:** {{ now()->format('F d, Y') }}
@endcomponent

## What This Means

Your identity has been confirmed, which helps build trust in the WorkWise community. This verification:

- ✅ Increases your profile credibility
- ✅ Shows employers you're a trusted gig worker
- ✅ Enables you to bid on more projects

## Next Steps

@if($user->profile_status === 'approved')
Your full profile is approved! You can now:

1. **Browse Available Jobs** - Start exploring opportunities
2. **Submit Proposals** - Bid on projects that match your skills
3. **Build Your Reputation** - Complete projects and earn reviews

@component('mail::button', ['url' => config('app.url') . '/jobs'])
Browse Jobs
@endcomponent

@else
Your profile is still under review. You'll receive another email once it's fully approved and you can start bidding on projects.
@endif

## Build Your Profile

Make your profile stand out:
- Add more portfolio items
- Update your skills and experience
- Set your availability preferences

@component('mail::button', ['url' => config('app.url') . '/profile/edit'])
Update Profile
@endcomponent

Thanks for being part of the WorkWise community!

Best regards,<br>
The {{ config('app.name') }} Team

@component('mail::subcopy')
**Security Note:** Your ID images are stored securely and are only accessible to authorized WorkWise staff for verification purposes.
@endcomponent
@endcomponent
