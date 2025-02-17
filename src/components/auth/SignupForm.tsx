
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, Building2, Loader2, User, Users, Phone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

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
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [startDate, setStartDate] = useState("");
  const [accessLevel, setAccessLevel] = useState("standard");
  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
    relationship: ""
  });

  // Fetch departments
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
    if (!email || !password || !departmentId || !firstName || !lastName || !title || !phone || !startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            title,
            phone,
            department_id: departmentId,
            employment_type: employmentType,
            start_date: startDate,
            access_level: accessLevel,
            emergency_contact: emergencyContact
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          toast.error("This email is already registered", {
            description: "Please sign in instead or use a different email address.",
            action: {
              label: "Sign In",
              onClick: onToggleForm
            }
          });
          return;
        }
        throw signUpError;
      }
      
      navigate("/verification-pending");
    } catch (error: any) {
      console.error("Auth error:", error);
      
      let errorMessage = "Signup failed";
      try {
        const errorBody = JSON.parse(error.body);
        errorMessage = errorBody.message || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formSections = [
    {
      id: "personal",
      icon: <User className="h-5 w-5 text-white/50" />,
      title: "Personal Information",
      children: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Job Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="Enter your job title"
              required
            />
          </div>
        </div>
      )
    },
    {
      id: "contact",
      icon: <Mail className="h-5 w-5 text-white/50" />,
      title: "Contact Information",
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>
      )
    },
    {
      id: "employment",
      icon: <Building2 className="h-5 w-5 text-white/50" />,
      title: "Employment Details",
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department" className="text-white">Department *</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} required>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select department" />
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
            <Label htmlFor="employmentType" className="text-white">Employment Type *</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-white">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessLevel" className="text-white">Access Level *</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="elevated">Elevated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      id: "emergency",
      icon: <Phone className="h-5 w-5 text-white/50" />,
      title: "Emergency Contact",
      children: (
        <div className="space-y-4">
          <Input
            placeholder="Contact Name"
            value={emergencyContact.name}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Input
            placeholder="Contact Phone"
            value={emergencyContact.phone}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Input
            placeholder="Relationship"
            value={emergencyContact.relationship}
            onChange={(e) => setEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
      )
    }
  ];

  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <Accordion type="single" collapsible className="w-full">
        {formSections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border-white/20">
            <AccordionTrigger className="text-white hover:text-white/80">
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
          className="w-full text-white hover:bg-white/10 transition-colors"
          onClick={onToggleForm}
          disabled={loading}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
};
