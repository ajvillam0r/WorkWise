@component('mail::message')
# Thank You for Submitting Your Profile!

Hi {{ $user->first_name }},

We've received your gig worker profile on **WorkWise** and wanted to confirm that it's currently being reviewed by our team.

## What Happens Next?

1. **Profile Review** - Our team will review your information and credentials
2. **ID Verification** - We'll verify your submitted identification document
3. **Approval** - You'll receive an email once your profile is approved (usually within 24-48 hours)

## Your Profile Details

- **Professional Title:** {{ $user->professional_title }}
- **Hourly Rate:** ₱{{ number_format($user->hourly_rate, 2) }}/hour
- **Skills:** {{ count($user->skills_with_experience ?? []) }} skills submitted
- **ID Type:** {{ $user->id_type_label ?? $user->id_type }}

@component('mail::panel')
**⏱️ Estimated Review Time:** 24-48 hours

We strive to review all profiles as quickly as possible. You'll receive an email notification once your profile status changes.
@endcomponent

## While You Wait

- **Complete your profile** - Add more portfolio items or update your availability
- **Browse jobs** - You can start exploring available projects
- **Learn about WorkWise** - Check out our [help center]({{ config('app.url') }}/help)

@component('mail::button', ['url' => config('app.url') . '/profile'])
View Your Profile
@endcomponent

If you have any questions, feel free to reach out to our support team at [support@workwise.com](mailto:support@workwise.com).

Thanks,<br>
The {{ config('app.name') }} Team

@component('mail::subcopy')
**Note:** This is an automated message. Your profile is in the queue and will be reviewed by our team shortly.
@endcomponent
@endcomponent
