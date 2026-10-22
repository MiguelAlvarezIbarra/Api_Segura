library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_controller.dart';
import 'task_controller.dart';
import 'task_list_view.dart';

class TaskPage extends ConsumerWidget {
  const TaskPage({super.key});

  void _showCreateTaskDialog(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nueva Tarea'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Título',
                border: OutlineInputBorder(),
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: 'Descripción (opcional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              final title = titleController.text.trim();
              if (title.isEmpty) return;

              final desc = descriptionController.text.trim();
              Navigator.of(ctx).pop();
              await ref.read(taskListProvider.notifier).createTask(
                    title,
                    desc.isEmpty ? null : desc,
                  );
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final taskState = ref.watch(taskListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Tareas'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authRepositoryProvider).logout().then((_) {
              ref.read(authStateProvider.notifier).signOut();
            }),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(taskListProvider.notifier).loadTasks(),
        child: TaskListView(
          loading: taskState.isLoading,
          tasks: taskState.tasks,
          errorMessage: taskState.errorMessage,
          onRetry: () => ref.read(taskListProvider.notifier).loadTasks(),
          onToggle: (task) =>
              ref.read(taskListProvider.notifier).toggleCompleted(task),
          onDelete: (task) =>
              ref.read(taskListProvider.notifier).deleteTask(task),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Agregar tarea',
        onPressed: () => _showCreateTaskDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }
}
