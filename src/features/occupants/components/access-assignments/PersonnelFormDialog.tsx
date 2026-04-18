import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    primary_role: z.enum(["judge", "clerk", "sergeant", "officer", "administrator"], {
        required_error: "Primary role is required",
    }),
    email: z.string().email("Invalid email").or(z.literal("")),
    title: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonnelFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** If provided, we are in Edit mode */
    personnelId?: string;
    /** Called after successful insert/update */
    onSuccess?: () => void;
}

export function PersonnelFormDialog({
    open,
    onOpenChange,
    personnelId,
    onSuccess,
}: PersonnelFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const queryClient = useQueryClient();

    const isEdit = !!personnelId;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            primary_role: "clerk",
            email: "",
            title: "",
            department: "",
            phone: "",
        },
    });

    useEffect(() => {
        if (open && isEdit && personnelId) {
            setIsFetching(true);
            supabase
                .from("personnel_profiles")
                .select("*")
                .eq("id", personnelId)
                .single()
                .then(({ data, error }) => {
                    if (!error && data) {
                        form.reset({
                            first_name: data.first_name || "",
                            last_name: data.last_name || "",
                            primary_role: (data.primary_role as any) || "clerk",
                            email: data.email || "",
                            title: data.title || "",
                            department: data.department || "",
                            phone: data.phone || "",
                        });
                    }
                    setIsFetching(false);
                });
        } else if (open && !isEdit) {
            form.reset({
                first_name: "",
                last_name: "",
                primary_role: "clerk",
                email: "",
                title: "",
                department: "",
                phone: "",
            });
        }
    }, [open, isEdit, personnelId, form]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            if (isEdit) {
                const { error } = await supabase
                    .from("personnel_profiles")
                    .update({
                        first_name: values.first_name,
                        last_name: values.last_name,
                        primary_role: values.primary_role,
                        email: values.email || null,
                        title: values.title || null,
                        department: values.department || null,
                        phone: values.phone || null,
                    })
                    .eq("id", personnelId);

                if (error) throw error;
                toast.success("Personnel updated successfully");
            } else {
                const { error } = await supabase.from("personnel_profiles").insert({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    primary_role: values.primary_role,
                    email: values.email || null,
                    title: values.title || null,
                    department: values.department || null,
                    phone: values.phone || null,
                    is_active: true,
                });

                if (error) throw error;
                toast.success("Personnel added successfully");
            }

            // Invalidate the personnel list cache
            queryClient.invalidateQueries({ queryKey: ["personnel-access"] });
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving personnel:", error);
            toast.error(getErrorMessage(error) || "Failed to save personnel");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Personnel" : "Add Personnel"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update personnel information below."
                            : "Add a new staff member to the court roster."}
                    </DialogDescription>
                </DialogHeader>

                {isFetching ? (
                    <div className="py-6 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="John" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Court Officer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Court Security" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john.doe@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEdit ? "Save Changes" : "Add Personnel"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
