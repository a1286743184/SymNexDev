import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../app/app_routes.dart';
import '../../../core/theme/app_icon_size.dart';
import '../../../core/theme/symnex_colors.dart';
import '../../../core/theme/symnex_theme.dart';
import '../../../core/extensions/context_extension.dart';
import '../../../widgets/common/secondary_page_scaffold.dart';

class AboutPage extends StatefulWidget {
  const AboutPage({super.key});

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() {
        _version = '${info.version} (${info.buildNumber})';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SecondaryPageScaffold(
      title: '关于',
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: SymNexTheme.space6),
        child: Column(
          children: [
            SizedBox(height: SymNexTheme.space12),
            Image.asset(
              'assets/new/Logo.png',
              width: AppIconSize.massive,
              height: AppIconSize.massive,
            ),
            SizedBox(height: SymNexTheme.space4),
            Text(
              'SymNex',
              style: context.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: SymNexTheme.space2),
            if (_version.isNotEmpty)
              Text(
                'v$_version',
                style: context.textTheme.bodyMedium?.copyWith(
                  color: SymNexColors.textTertiary,
                ),
              ),
            SizedBox(height: SymNexTheme.space6),
            ListTile(
              leading: Container(
                width: SymNexTheme.sizeIconContainerMD,
                height: SymNexTheme.sizeIconContainerMD,
                decoration: BoxDecoration(
                  color: SymNexColors.primary.withValues(alpha: SymNexTheme.opacityIconBg),
                  borderRadius: BorderRadius.circular(SymNexTheme.radiusMD),
                ),
                child: Icon(LucideIcons.refreshCw, size: AppIconSize.md, color: context.colorScheme.primary),
              ),
              title: const Text('检查更新'),
              trailing: const Icon(Icons.chevron_right, size: AppIconSize.md),
              onTap: () => context.push(AppRoutes.moreUpdate),
            ),
            ListTile(
              leading: Container(
                width: SymNexTheme.sizeIconContainerMD,
                height: SymNexTheme.sizeIconContainerMD,
                decoration: BoxDecoration(
                  color: context.colorScheme.primary.withValues(alpha: SymNexTheme.opacityIconBg),
                  borderRadius: BorderRadius.circular(SymNexTheme.radiusMD),
                ),
                child: Icon(Icons.description_outlined, size: AppIconSize.md, color: context.colorScheme.primary),
              ),
              title: const Text('开源许可'),
              trailing: const Icon(Icons.chevron_right, size: AppIconSize.md),
              onTap: () {
                showLicensePage(
                  context: context,
                  applicationName: 'SymNex',
                  applicationVersion: _version,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
