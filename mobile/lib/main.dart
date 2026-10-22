import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/auth/presentation/auth_controller.dart';
import 'features/auth/presentation/auth_page.dart';
import 'features/tasks/presentation/task_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SecureTaskManagerApp()));
}

class SecureTaskManagerApp extends ConsumerWidget {
  const SecureTaskManagerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      title: 'Secure Task Manager',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      home: switch (authState.status) {
        AuthStatus.initial => const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          ),
        AuthStatus.authenticated => const TaskPage(),
        AuthStatus.unauthenticated => const AuthPage(),
      },
    );
  }
}
