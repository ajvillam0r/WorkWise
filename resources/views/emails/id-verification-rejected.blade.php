@component('mail::message')
# {{ $isResubmission ? 'Please Resubmit Your ID' : 'ID Verification Update' }}

Hi {{ $user->first_name }},

Thank you for submitting your identification document. {{ $isResubmission ? 'We need you to resubmit your ID with some corrections.' : 'Unfortunately, we were unable to verify your ID at this time.' }}

@component('mail::panel')
{{ $isResubmission ? '🔄 Resubmission Required' : '❌ Verification Status: Not Approved' }}

**Reason:**  
{{ $reason }}
@endcomponent

## What You Need to Do

To complete your verification, please resubmit your ID with the following requirements:

### ID Upload Guidelines

✅ **Image Quality**
- Clear, well-lit photo
- All text must be readable
- No blur or glare
- Minimum 800x600 resolution

✅ **Accepted ID Types**
- National ID (PhilSys)
- Driver's License
- Passport
- PhilHealth ID
- SSS ID
- UMID
- Voter's ID
- PRC ID

✅ **Photo Requirements**
- Front and back sides required
- Entire ID must be visible
- No partial or cropped images
- Original document (not photocopies)

@component('mail::button', ['url' => config('app.url') . '/profile/edit'])
Resubmit ID
@endcomponent

## Need Help?

If you're having trouble uploading your ID or have questions about the requirements, our support team is here to help:

- 📧 Email: [support@workwise.com](mailto:support@workwise.com)
- 💬 Live Chat: Available on our website
- 📞 Phone: [Your phone number]

@component('mail::panel')
**📌 Tips for Better Photos:**

1. Use good lighting (natural daylight is best)
2. Place ID on a dark, solid background
3. Hold camera directly above the ID
4. Ensure all corners are visible
5. Avoid shadows and reflections
@endcomponent

We appreciate your patience and look forward to approving your profile soon!

Best regards,<br>
The {{ config('app.name') }} Team

@component('mail::subcopy')
**Privacy:** Your ID information is securely stored and used only for verification purposes in accordance with our [Privacy Policy]({{ config('app.url') }}/privacy).
@endcomponent
@endcomponent
