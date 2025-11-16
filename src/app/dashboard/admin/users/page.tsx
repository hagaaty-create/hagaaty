'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Edit, Shield, UserX, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user';
  balance: number;
  referralCode: string;
  referralEarnings: number;
  status: 'active' | 'suspended';
  createdAt: Timestamp;
};

export default function ManageUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDisplayName(user.displayName);
    setBalanceAdjustment('');
    setIsDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !selectedUser) return;
    
    const updates: { [key: string]: any } = {};
    const amount = parseFloat(balanceAdjustment);

    if (displayName !== selectedUser.displayName) {
        updates.displayName = displayName;
    }

    if (!isNaN(amount) && amount !== 0) {
      updates.balance = selectedUser.balance + amount;
    }

    if (Object.keys(updates).length === 0) {
        toast({ variant: 'default', title: 'لا توجد تغييرات', description: 'لم تقم بإجراء أي تغييرات.' });
        setIsDialogOpen(false);
        return;
    }

    const userRef = doc(firestore, 'users', selectedUser.id);
    try {
      await updateDoc(userRef, updates);
      toast({ title: 'تم تحديث المستخدم', description: `تم تحديث بيانات ${selectedUser.displayName} بنجاح.` });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ variant: 'destructive', title: 'فشل التحديث', description: 'لم نتمكن من تحديث بيانات المستخدم.' });
    } finally {
      setIsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleSuspend = async (user: UserProfile) => {
    if (!firestore) return;
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const userRef = doc(firestore, 'users', user.id);
    try {
      await updateDoc(userRef, { status: newStatus });
      toast({ title: 'تم تحديث حالة المستخدم', description: `حالة ${user.displayName} الآن ${newStatus === 'active' ? 'نشط' : 'معلق'}.` });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: 'destructive', title: 'فشل التحديث' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'users', userId));
        toast({
            title: 'تم حذف المستخدم',
            description: `تم حذف المستخدم ${userName} نهائيًا.`,
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({
            variant: 'destructive',
            title: 'فشل الحذف',
            description: 'لا يمكن حذف المستخدم. يرجى التحقق من قواعد الأمان والمحاولة مرة أخرى.',
        });
    }
  };


  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Timestamp) {
        return format(timestamp.toDate(), 'PPP');
    }
    return 'Invalid Date';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">إدارة المستخدمين</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>جميع المستخدمين المسجلين</CardTitle>
          <CardDescription>عرض وتعديل معلومات المستخدمين المسجلين في المنصة.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {!isLoading && users && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className={user.status === 'suspended' ? 'bg-destructive/10' : ''}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="font-mono">${user.balance.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={user.status === 'suspended' ? 'destructive' : 'default'}>
                            {user.status === 'suspended' ? 'معلق' : 'نشط'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge variant="secondary" className="border-primary/50 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          مسؤول
                        </Badge>
                      ) : 'مستخدم'}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleSuspend(user)}>
                        <UserX className="h-4 w-4 text-orange-500" />
                      </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon">
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المستخدم{" "}
                                <strong>{user.displayName}</strong>{" "}
                                بشكل دائم من قاعدة البيانات.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id, user.displayName)} 
                                className={buttonVariants({ variant: "destructive" })}
                              >
                                نعم، احذف المستخدم
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات: {selectedUser?.displayName}</DialogTitle>
            <DialogDescription>
              قم بتعديل اسم المستخدم أو إضافة/خصم رصيد من حسابه.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right col-span-1">
                الاسم
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance-adjustment" className="text-right col-span-1">
                تعديل الرصيد
              </Label>
              <Input
                id="balance-adjustment"
                type="number"
                value={balanceAdjustment}
                onChange={(e) => setBalanceAdjustment(e.target.value)}
                className="col-span-3"
                placeholder={`الرصيد الحالي: $${selectedUser?.balance.toFixed(2)}`}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">إلغاء</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveChanges}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
