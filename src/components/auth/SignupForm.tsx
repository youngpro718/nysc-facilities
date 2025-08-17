import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, Building2, Loader2, User, Users, Phone, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSecureAuth } from '@/hooks/security/useSecureAuth';
import { UserSignupData } from "@/types/auth";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { AvatarUploadStep } from "./AvatarUploadStep";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

interface SignupFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onToggleForm: () => void;
}

export const SignupForm = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  setLoading,
  onToggleForm,
}: SignupFormProps) => {
  const { secureSignUp, isLoading: authLoading } = useSecureAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courtPosition, setCourtPosition] = useState("");
  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
    relationship: ""
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { uploadAvatar } = useAvatarUpload();

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email, and Password)");
      return;
    }

    try {
      setLoading(true);
      
      const userData: UserSignupData = {
        first_name: firstName,
        last_name: lastName,
        title: title || undefined,
        phone: phone || undefined,
        department_id: departmentId || undefined,
        court_position: courtPosition || undefined,
        emergency_contact: Object.values(emergencyContact).some(Boolean) ? emergencyContact : undefined
      };
      
      await secureSignUp(email, password, userData);
      
      // Upload avatar if selected - need to wait for user to be created
      if (avatarFile) {
        // Small delay to ensure user is fully created
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            try {
              await uploadAvatar(avatarFile, user.id);
            } catch (error) {
              console.error('Avatar upload error:', error);
              toast.error('Account created but avatar upload failed');
            }
          }
        }, 1000);
      }
      
      toast.success('Account created successfully! Please check your email for verification.');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  const formSections = [
    {
      id: "personal",
      icon: <User className="h-5 w-5 text-slate-500" />,
      title: "Personal Information",
      children: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-700">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className=""
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-700">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className=""
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courtPosition" className="text-slate-700">Court Position</Label>
            <Select value={courtPosition} onValueChange={setCourtPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select your position (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="judge">Judge</SelectItem>
                <SelectItem value="clerk">Court Clerk</SelectItem>
                <SelectItem value="officer">Court Officer</SelectItem>
                <SelectItem value="officer_sergeant">Court Officer Sergeant</SelectItem>
                <SelectItem value="officer_lieutenant">Court Officer Lieutenant</SelectItem>
                <SelectItem value="officer_major">Court Officer Major</SelectItem>
                <SelectItem value="court_attorney">Court Attorney</SelectItem>
                <SelectItem value="court_reporter">Court Reporter</SelectItem>
                <SelectItem value="court_interpreter">Court Interpreter</SelectItem>
                <SelectItem value="court_analyst">Court Analyst</SelectItem>
                <SelectItem value="assistant_court_analyst">Assistant Court Analyst</SelectItem>
                <SelectItem value="clerical">Clerical Staff</SelectItem>
                <SelectItem value="administrative">Administrative Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      id: "contact",
      icon: <Mail className="h-5 w-5 text-slate-500" />,
      title: "Contact Information",
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className=""
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className=""
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className=""
              placeholder="Enter your phone number (optional)"
            />
          </div>
        </div>
      )
    },
    {
      id: "department",
      icon: <Building2 className="h-5 w-5 text-slate-500" />,
      title: "Court Information",
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department" className="text-slate-700">Court</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select court (optional)" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">Official Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className=""
              placeholder="Enter your official title (optional)"
            />
          </div>
        </div>
      )
    },
    {
      id: "emergency",
      icon: <Phone className="h-5 w-5 text-slate-500" />,
      title: "Emergency Contact",
      children: (
        <div className="space-y-4">
          <Input
            placeholder="Contact Name (optional)"
            value={emergencyContact.name}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
            className=""
          />
          <Input
            placeholder="Contact Phone (optional)"
            value={emergencyContact.phone}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
            className=""
          />
          <Input
            placeholder="Relationship (optional)"
            value={emergencyContact.relationship}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
            className=""
          />
        </div>
      )
    },
    {
      id: "avatar",
      icon: <Camera className="h-5 w-5 text-slate-500" />,
      title: "Profile Picture",
      children: (
        <AvatarUploadStep 
          firstName={firstName}
          lastName={lastName}
          onAvatarSelect={setAvatarFile}
        />
      )
    }
  ];

  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <Accordion type="single" collapsible className="w-full">
        {formSections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border-border">
            <AccordionTrigger className="text-slate-800 hover:text-slate-900">
              <div className="flex items-center gap-2">
                {section.icon}
                <span>{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>{section.children}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-white text-courthouse hover:bg-white/90 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Create Account"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-slate-600 hover:text-slate-800 transition-colors"
          onClick={onToggleForm}
          disabled={loading}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
};
