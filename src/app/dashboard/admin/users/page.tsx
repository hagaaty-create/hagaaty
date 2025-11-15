'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Edit, Shield, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

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
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setBalanceAdjustment('');
    setIsDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !selectedUser) return;

    const amount = parseFloat(balanceAdjustment);
    if (isNaN(amount)) {
      toast({ variant: 'destructive', title: 'قيمة غير صالحة', description: 'الرجاء إدخال رقم صحيح لضبط الرصيد.' });
      return;
    }

    const userRef = doc(firestore, 'users', selectedUser.id);
    try {
      await updateDoc(userRef, {
        balance: selectedUser.balance + amount
      });
      toast({ title: 'تم تحديث الرصيد', description: `تم تحديث رصيد ${selectedUser.displayName} بنجاح.` });
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({ variant: 'destructive', title: 'فشل التحديث', description: 'لم نتمكن من تحديث الرصيد.' });
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


  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleSuspend(user)}>
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
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
            <DialogTitle>تعديل رصيد: {selectedUser?.displayName}</DialogTitle>
            <DialogDescription>
              أدخل قيمة موجبة للإضافة أو سالبة للخصم. الرصيد الحالي هو ${selectedUser?.balance.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance-adjustment" className="text-right col-span-1">
                المبلغ
              </Label>
              <Input
                id="balance-adjustment"
                type="number"
                value={balanceAdjustment}
                onChange={(e) => setBalanceAdjustment(e.target.value)}
                className="col-span-3"
                placeholder="مثال: 50 أو -10"
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
