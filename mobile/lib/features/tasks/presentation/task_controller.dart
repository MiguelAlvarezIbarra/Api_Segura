library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/task_repository.dart';
import '../domain/task.dart';
import '../../auth/presentation/auth_controller.dart';

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return TaskRepository(client);
});

class TaskListState {
  final List<Task> tasks;
  final bool isLoading;
  final String? errorMessage;

  const TaskListState({
    this.tasks = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  TaskListState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    String? errorMessage,
  }) {
    return TaskListState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class TaskListNotifier extends StateNotifier<TaskListState> {
  final TaskRepository _repository;

  TaskListNotifier(this._repository) : super(const TaskListState(isLoading: true)) {
    loadTasks();
  }

  Future<void> loadTasks() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final tasks = await _repository.list();
      state = state.copyWith(tasks: tasks, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> createTask(String title, String? description) async {
    try {
      final created = await _repository.create(title, description);
      state = state.copyWith(tasks: [created, ...state.tasks]);
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
      rethrow;
    }
  }

  Future<void> toggleCompleted(Task task) async {
    final originalTasks = state.tasks;
    // Optimistic update
    state = state.copyWith(
      tasks: state.tasks.map((t) {
        if (t.id == task.id) {
          return Task(
            id: t.id,
            title: t.title,
            description: t.description,
            completed: !t.completed,
          );
        }
        return t;
      }).toList(),
    );

    try {
      final updated = await _repository.setCompleted(task, !task.completed);
      state = state.copyWith(
        tasks: state.tasks.map((t) => t.id == updated.id ? updated : t).toList(),
      );
    } catch (e) {
      state = state.copyWith(tasks: originalTasks, errorMessage: e.toString());
    }
  }

  Future<void> deleteTask(Task task) async {
    final originalTasks = state.tasks;
    state = state.copyWith(
      tasks: state.tasks.where((t) => t.id != task.id).toList(),
    );

    try {
      await _repository.delete(task.id);
    } catch (e) {
      state = state.copyWith(tasks: originalTasks, errorMessage: e.toString());
    }
  }
}

final taskListProvider =
    StateNotifierProvider<TaskListNotifier, TaskListState>((ref) {
  final repository = ref.watch(taskRepositoryProvider);
  return TaskListNotifier(repository);
});
