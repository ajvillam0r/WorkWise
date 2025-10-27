@component('mail::message')
# Profile Review - Action Required

Hi {{ $user->first_name }},

Thank you for your interest in joining WorkWise as a gig worker. After reviewing your profile, we need you to make some updates before we can approve it.

@component('mail::panel')
**📋 Profile Status: Requires Updates**

**Reason:**  
{{ $reason }}
@endcomponent

## What You Need to Do

Please review the feedback above and update your profile accordingly. Here are some common areas that may need improvement:

### Profile Quality Checklist

✅ **Professional Bio**
- Minimum 50 characters
- Clear description of your skills and experience
- Professional tone
- No contact information (use WorkWise messaging)

✅ **Skills & Experience**
- Select at least 3 relevant skills
- Set appropriate experience levels
- Match skills to your actual expertise

✅ **Portfolio (Recommended)**
- Add work samples
- Include project descriptions
- Show your best work
- Demonstrate your capabilities

✅ **Professional Information**
- Accurate hourly rate
- Complete availability settings
- Professional profile photo (if provided)

✅ **ID Verification**
- Clear, readable ID images
- Both front and back uploaded
- Valid, non-expired ID
- Meets quality requirements

@component('mail::button', ['url' => config('app.url') . '/profile/edit'])
Update Your Profile
@endcomponent

## Why Profile Quality Matters

A complete, professional profile helps you:
- **Stand out** to potential clients
- **Build trust** in the community
- **Win more projects** with better proposals
- **Earn higher rates** with proven expertise

## Tips for a Strong Profile

### 1. Write a Compelling Bio
- Highlight your unique value proposition
- Mention years of experience
- Include relevant certifications
- Show personality while staying professional

### 2. Showcase Your Work
- Add 3-5 portfolio items
- Include variety in your samples
- Write detailed project descriptions
- Demonstrate problem-solving skills

### 3. Set Competitive Rates
- Research market rates
- Consider your experience level
- Start competitive, increase as you build reputation
- Factor in your unique skills

### 4. Be Detailed with Skills
- List all relevant skills
- Set honest experience levels
- Include both technical and soft skills
- Keep skills current and relevant

@component('mail::panel')
**Need Help?**

Our support team is here to assist you:
- 📧 Email: [support@workwise.com](mailto:support@workwise.com)
- 💬 Live Chat: Available on our website
- 📚 [Profile Best Practices Guide]({{ config('app.url') }}/help/profile-guide)
@endcomponent

## Resubmission Process

Once you've updated your profile:
1. Click the button above to edit your profile
2. Make the necessary changes
3. Save your updates
4. Our team will review again (usually within 24 hours)
5. You'll receive an email with the result

We want to see you succeed on WorkWise! Please don't hesitate to reach out if you need any assistance with your profile updates.

Looking forward to approving your profile soon!

Best regards,<br>
The {{ config('app.name') }} Team

@component('mail::subcopy')
**Important:** Please update your profile within 7 days. If no updates are made, you may need to re-register. [Learn more]({{ config('app.url') }}/help/profile-requirements)
@endcomponent
@endcomponent
