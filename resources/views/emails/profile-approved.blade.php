@component('mail::message')
# 🎉 Congratulations! Your Profile is Approved

Hi {{ $user->first_name }},

**Welcome to the WorkWise community!** We're excited to let you know that your profile has been fully approved and you can now start bidding on projects.

@component('mail::panel')
**✅ Profile Status: APPROVED**

You're all set to start your journey as a gig worker on WorkWise!
@endcomponent

## What You Can Do Now

### 1. Browse Available Jobs
Explore hundreds of projects across various categories matching your skills.

@component('mail::button', ['url' => config('app.url') . '/jobs'])
Browse Jobs
@endcomponent

### 2. Submit Proposals
Found an interesting project? Submit your proposal and showcase why you're the best fit.

### 3. Build Your Reputation
- Complete projects successfully
- Earn 5-star reviews from clients
- Build your portfolio with real work
- Increase your earning potential

## Your Profile Highlights

- **Professional Title:** {{ $user->professional_title }}
- **Hourly Rate:** ₱{{ number_format($user->hourly_rate, 2) }}/hour
- **Skills:** {{ count($user->skills_with_experience ?? []) }} verified skills
- **ID Status:** ✅ Verified
- **Profile Status:** ✅ Approved

## Pro Tips for Success

💡 **Complete Your Profile**
- Add more portfolio items
- Update your availability
- Write a compelling bio

💡 **Submit Quality Proposals**
- Personalize each proposal
- Highlight relevant experience
- Be competitive with pricing

💡 **Deliver Excellent Work**
- Communicate clearly with clients
- Meet deadlines
- Go above and beyond

💡 **Build Your Reputation**
- Aim for 5-star reviews
- Maintain high completion rates
- Respond quickly to messages

## Get Started

Ready to land your first project? Here's what to do:

1. **Browse available jobs** in your skill categories
2. **Submit compelling proposals** for 3-5 projects
3. **Respond quickly** to client messages
4. **Deliver quality work** and build your reputation

@component('mail::button', ['url' => config('app.url') . '/jobs'])
Find Your First Project
@endcomponent

## Need Help Getting Started?

Check out these resources:
- [How to Win Projects Guide]({{ config('app.url') }}/help/winning-projects)
- [Writing Winning Proposals]({{ config('app.url') }}/help/proposals)
- [Payment & Escrow System]({{ config('app.url') }}/help/payments)
- [Community Guidelines]({{ config('app.url') }}/terms)

## Stay Connected

- 📧 **Support:** [support@workwise.com](mailto:support@workwise.com)
- 💬 **Community:** Join our [Discord server](#)
- 📱 **Updates:** Follow us on [social media](#)

@component('mail::panel')
**🌟 Special Offer for New Gig Workers**

Your first completed project is **fee-free!** We'll waive the platform fee to help you get started. Happy bidding!
@endcomponent

We're thrilled to have you as part of the WorkWise community. Here's to your success!

Best of luck,<br>
The {{ config('app.name') }} Team

@component('mail::subcopy')
**Questions?** Reply to this email or visit our [Help Center]({{ config('app.url') }}/help) anytime.
@endcomponent
@endcomponent
