import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      // Delete all the user's ChildProgress records
      const records = await base44.entities.ChildProgress.list();
      for (const r of records) {
        await base44.entities.ChildProgress.delete(r.id);
      }
      // Clear local storage
      localStorage.removeItem('lexia_profile');
      localStorage.removeItem('lexia_daily_challenge');
      // Logout and redirect to login
      await base44.auth.logout('/');
    } catch (err) {
      console.error('Account deletion failed:', err);
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 font-body font-bold"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Minha Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg text-foreground">
            Excluir sua conta?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body text-sm text-muted-foreground">
            Isso vai apagar todo o seu progresso de aprendizado (estrelas, letras dominadas, sílabas e insígnias).
            Esta ação não pode ser desfeita. Você será desconectado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl font-body font-bold" disabled={deleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body font-bold gap-2"
          >
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</> : 'Sim, excluir tudo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}