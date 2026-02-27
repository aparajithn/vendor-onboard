import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { company_name, email } = await request.json();

    if (!company_name || !email) {
      return NextResponse.json({ message: 'Company name and email are required' }, { status: 400 });
    }

    // Get or create business for current user
    let { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_email', user.email)
      .single();

    if (businessError || !business) {
      // Create business if it doesn't exist
      const { data: newBusiness, error: createError } = await supabase
        .from('businesses')
        .insert({
          name: 'My Business', // Can be customized later
          owner_email: user.email,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ message: 'Failed to create business' }, { status: 500 });
      }

      business = newBusiness;
    }

    // Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex');

    // Create vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        business_id: business.id,
        company_name,
        email,
        status: 'invited',
        invite_token: inviteToken,
      })
      .select()
      .single();

    if (vendorError) {
      return NextResponse.json({ message: 'Failed to create vendor: ' + vendorError.message }, { status: 500 });
    }

    // TODO: Send invite email via Resend
    // For now, we'll just return the invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboard/${inviteToken}`;

    console.log('Invite link:', inviteLink);
    console.log('Email would be sent to:', email);

    return NextResponse.json({ 
      message: 'Vendor invited successfully',
      vendor,
      inviteLink 
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
