
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Pencil, Save } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TechnicalConstraintsProps {
  technicalConstraints: string;
}

export function TechnicalConstraints({ technicalConstraints }: TechnicalConstraintsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConstraints, setEditedConstraints] = useState(technicalConstraints);

  const handleSave = () => {
    // In a real app, you'd save these changes to your backend
    setIsEditing(false);
  };

  const constraints = technicalConstraints.split('\n').filter(Boolean);

  return (
    <Card className="p-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl mb-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-violet-600 dark:text-violet-400 m-0">
          Technical Constraints
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsEditing(true);
            setEditedConstraints(technicalConstraints);
          }}
          className="text-violet-600 dark:text-violet-400"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Refine
        </Button>
      </div>
      
      {isEditing ? (
        <div className="space-y-4 mt-4">
          <Textarea
            value={editedConstraints}
            onChange={(e) => setEditedConstraints(e.target.value)}
            className="w-full min-h-[200px]"
            placeholder="Enter technical constraints, one per line"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedConstraints(technicalConstraints);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <ul className="list-none p-0 m-0 space-y-2 mt-4">
          {constraints.map((constraint, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-1 text-violet-500" />
              {constraint}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
