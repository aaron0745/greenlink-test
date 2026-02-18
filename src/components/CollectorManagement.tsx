import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CollectorManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCollector(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      setIsOpen(false);
      toast({ title: "Success", description: "Collector added to database." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Parse wards string "1, 2" into array [1, 2]
    const wardString = formData.get('wards') as string;
    const wardArray = wardString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      ward: wardArray,
      status: 'active',
      totalCollections: 0,
      avatar: (formData.get('name') as string).substring(0, 2).toUpperCase()
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Collector
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Collector</DialogTitle>
          <DialogDescription>
            Register a new worker in the database. Note: This only creates the record, not the login account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="e.g. Rahul K." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" placeholder="e.g. 98470XXXXX" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wards">Assigned Wards (Comma separated)</Label>
            <Input id="wards" name="wards" placeholder="e.g. 1, 2, 5" required />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Collector Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
