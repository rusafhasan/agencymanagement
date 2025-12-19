import { useState } from 'react';
import { Task, Comment, TaskStatus, useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useAuth, User } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare, Trash2, User as UserIcon, Send } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  comments: Comment[];
  employees: User[];
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; className: string }[] = [
  { value: 'not-started', label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  { value: 'in-progress', label: 'In Progress', className: 'bg-primary/10 text-primary' },
  { value: 'needs-review', label: 'Needs Review', className: 'bg-warning/10 text-warning' },
  { value: 'completed', label: 'Completed', className: 'bg-success/10 text-success' },
];

export default function TaskDetailModal({
  task,
  comments,
  employees,
  isOpen,
  onClose,
  readOnly = false,
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const { updateTask, deleteTask, createComment } = useProjectManagement();
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [newComment, setNewComment] = useState('');

  // Clients can view but not edit tasks - but CAN post comments
  const canEdit = !readOnly && (user?.role === 'admin' || user?.role === 'employee');
  const canComment = !!user; // All authenticated users can comment
  const canDelete = user?.role === 'admin';

  const handleSave = () => {
    updateTask(task.id, {
      title,
      description,
      status,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      createComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="font-display text-lg">Task Details</DialogTitle>
              {readOnly && (
                <p className="text-xs text-muted-foreground">View only • Comments enabled</p>
              )}
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              {canEdit ? (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-medium" />
              ) : (
                <p className="font-medium">{title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
              {canEdit ? (
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">{description || 'No description provided'}</p>
              )}
            </div>

            {/* Status, Assignee, Due Date Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                {canEdit ? (
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={currentStatus?.className}>{currentStatus?.label}</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</Label>
                {canEdit ? (
                  <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(employees.find(e => e.id === assignedTo)?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{employees.find(e => e.id === assignedTo)?.name || 'Unassigned'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</Label>
                {canEdit ? (
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{dueDate ? format(new Date(dueDate), 'MMM d, yyyy') : 'No due date'}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Comments ({comments.length})
                </Label>
              </div>

              {/* Add comment input - Available for ALL users including clients */}
              {canComment && (
                <div className="flex gap-3 items-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!newComment.trim()}
                      size="icon"
                      className="h-auto aspect-square shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing comments */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                          {getInitials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 bg-muted/50 rounded-lg p-3">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
