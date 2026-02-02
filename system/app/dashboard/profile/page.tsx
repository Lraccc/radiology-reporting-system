'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Camera, Loader2, Save, User, Check, X, ArrowLeft, Home, UserPlus, Trash2, Users, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [connectedDoctors, setConnectedDoctors] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setMobileNumber((profile as any).mobile_number || '');
      setProfilePictureUrl((profile as any).profile_picture_url || '');
      
      if (profile.role === 'rad_tech') {
        fetchConnectedDoctors();
      }
    }
  }, [profile]);

  useEffect(() => {
    // Validate password requirements in real-time
    setPasswordRequirements({
      minLength: newPassword.length >= 6,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  const fetchConnectedDoctors = async () => {
    if (!user) return;

    try {
      // Fetch connected doctors
      const { data: connections, error: connectionsError } = await supabase
        .from('rad_tech_doctor_connections')
        .select(`
          id,
          doctor_id,
          profiles!rad_tech_doctor_connections_doctor_id_fkey(id, full_name, email, mobile_number)
        `)
        .eq('rad_tech_id', user.id);

      if (connectionsError) throw connectionsError;

      const connected = connections?.map((c: any) => ({
        connection_id: c.id,
        ...c.profiles,
      })) || [];

      setConnectedDoctors(connected);

      // Fetch all doctors to show available ones
      const { data: allDoctors, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'doctor')
        .order('full_name');

      if (doctorsError) throw doctorsError;

      // Filter out already connected doctors
      const connectedIds = connected.map((d: any) => d.id);
      const available = allDoctors?.filter((d: any) => !connectedIds.includes(d.id)) || [];
      setAvailableDoctors(available);
      setFilteredDoctors(available); // Initialize filtered list
    } catch (error: any) {
      console.error('Error fetching connected doctors:', error);
      toast.error('Failed to load doctor connections');
    }
  };

  // Filter doctors based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(availableDoctors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableDoctors.filter(
        (doctor) =>
          doctor.full_name.toLowerCase().includes(query) ||
          doctor.email.toLowerCase().includes(query)
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, availableDoctors]);

  const handleAddDoctor = async () => {
    if (!selectedDoctorId || !user) return;

    setIsAddingDoctor(true);

    try {
      const { error } = await supabase
        .from('rad_tech_doctor_connections')
        .insert({
          rad_tech_id: user.id,
          doctor_id: selectedDoctorId,
        });

      if (error) throw error;

      toast.success('Doctor added to your connections!');
      setSelectedDoctorId('');
      setSearchQuery('');
      setIsDialogOpen(false);
      await fetchConnectedDoctors();
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      toast.error(error.message || 'Failed to add doctor');
    } finally {
      setIsAddingDoctor(false);
    }
  };

  const handleRemoveDoctor = async (connectionId: string, doctorName: string) => {
    if (!confirm(`Remove ${doctorName} from your connections?`)) return;

    try {
      const { error } = await supabase
        .from('rad_tech_doctor_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Doctor removed from your connections');
      await fetchConnectedDoctors();
    } catch (error: any) {
      console.error('Error removing doctor:', error);
      toast.error('Failed to remove doctor');
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Delete old profile picture if exists
      if (profilePictureUrl) {
        const oldPath = profilePictureUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new profile picture
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePictureUrl(publicUrl);
      toast.success('Profile picture updated successfully!');
      
      // Refresh the page to update the auth context
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          mobile_number: mobileNumber || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) throw emailError;
        toast.success('Profile updated! Please check your email to confirm the new email address.');
      } else {
        toast.success('Profile updated successfully!');
      }

      // Refresh the page to update the auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all password requirements
    if (!passwordRequirements.minLength || !passwordRequirements.hasUppercase || 
        !passwordRequirements.hasLowercase || !passwordRequirements.hasNumber) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsUpdatingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully!');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  const roleDisplay = profile?.role === 'rad_tech' ? 'Radiological Technician' : 'Doctor';
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
            <p className="text-slate-600 mt-1">Manage your account information and preferences</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a profile picture to personalize your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePictureUrl} alt={fullName} />
                <AvatarFallback className="bg-blue-500 text-white text-2xl">
                  {initials || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="profile-picture" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingImage}
                      asChild
                    >
                      <span>
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </Label>
                <Input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={isUploadingImage}
                />
                <p className="text-xs text-slate-500 mt-2">
                  JPG, PNG or GIF (max. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    type="text"
                    value={roleDisplay}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Changing your email will require confirmation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Optional</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-medium text-slate-700 mb-2">Password Requirements:</p>
                    
                    <div className="space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        passwordRequirements.minLength ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        <div className={`rounded-full p-0.5 transition-all duration-300 ${
                          passwordRequirements.minLength 
                            ? 'bg-green-500 scale-100' 
                            : 'bg-slate-300 scale-90'
                        }`}>
                          {passwordRequirements.minLength ? (
                            <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                          ) : (
                            <X className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className={passwordRequirements.minLength ? 'font-medium' : ''}>
                          At least 6 characters
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        passwordRequirements.hasUppercase ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        <div className={`rounded-full p-0.5 transition-all duration-300 ${
                          passwordRequirements.hasUppercase 
                            ? 'bg-green-500 scale-100' 
                            : 'bg-slate-300 scale-90'
                        }`}>
                          {passwordRequirements.hasUppercase ? (
                            <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                          ) : (
                            <X className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className={passwordRequirements.hasUppercase ? 'font-medium' : ''}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        passwordRequirements.hasLowercase ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        <div className={`rounded-full p-0.5 transition-all duration-300 ${
                          passwordRequirements.hasLowercase 
                            ? 'bg-green-500 scale-100' 
                            : 'bg-slate-300 scale-90'
                        }`}>
                          {passwordRequirements.hasLowercase ? (
                            <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                          ) : (
                            <X className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className={passwordRequirements.hasLowercase ? 'font-medium' : ''}>
                          One lowercase letter (a-z)
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        passwordRequirements.hasNumber ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        <div className={`rounded-full p-0.5 transition-all duration-300 ${
                          passwordRequirements.hasNumber 
                            ? 'bg-green-500 scale-100' 
                            : 'bg-slate-300 scale-90'
                        }`}>
                          {passwordRequirements.hasNumber ? (
                            <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                          ) : (
                            <X className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className={passwordRequirements.hasNumber ? 'font-medium' : ''}>
                          One number (0-9)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Doctor Connections Section - Only for Rad Techs */}
        {profile?.role === 'rad_tech' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Doctor Connections
                  </CardTitle>
                  <CardDescription>
                    Manage doctors you work with. Only connected doctors will appear in case assignment dropdown.
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Doctor to Your Connections</DialogTitle>
                      <DialogDescription>
                        Search and select a doctor to add to your connection list. They will appear in the case assignment dropdown.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {availableDoctors.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No available doctors to add. You've connected with all doctors in the system.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="doctor-search">Search Doctor</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                id="doctor-search"
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          {/* Doctors List */}
                          <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg">
                            {filteredDoctors.length === 0 ? (
                              <p className="text-sm text-slate-500 text-center py-8">
                                No doctors found matching "{searchQuery}"
                              </p>
                            ) : (
                              filteredDoctors.map((doctor) => (
                                <button
                                  key={doctor.id}
                                  type="button"
                                  onClick={() => setSelectedDoctorId(doctor.id)}
                                  className={`w-full text-left p-3 hover:bg-slate-50 transition-colors border-b last:border-b-0 ${
                                    selectedDoctorId === doctor.id
                                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                                        {doctor.full_name
                                          .split(' ')
                                          .map((n: string) => n[0])
                                          .join('')
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900">{doctor.full_name}</p>
                                      <p className="text-sm text-slate-500">{doctor.email}</p>
                                    </div>
                                    {selectedDoctorId === doctor.id && (
                                      <Check className="h-5 w-5 text-blue-500" />
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setSelectedDoctorId('');
                                setSearchQuery('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddDoctor}
                              disabled={!selectedDoctorId || isAddingDoctor}
                            >
                              {isAddingDoctor ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                'Add Doctor'
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {connectedDoctors.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No doctor connections yet</p>
                  <p className="text-sm mt-1">Add doctors to start assigning cases to them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white text-sm">
                            {doctor.full_name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{doctor.full_name}</p>
                          <p className="text-sm text-slate-500">{doctor.email}</p>
                          {doctor.mobile_number && (
                            <p className="text-xs text-slate-400">{doctor.mobile_number}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveDoctor(doctor.connection_id, doctor.full_name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
