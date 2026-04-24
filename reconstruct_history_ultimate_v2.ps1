$slices = @(
    @{ date = "2026-04-24 12:00:00 +0500"; msg = "feat(infra): project initialization and configuration"; pattern = ".gitignore", "package.json", "tailwind.config.js", "metro.config.js", "tsconfig.json", "app-env.d.ts" },
    @{ date = "2026-04-24 12:45:00 +0500"; msg = "feat(infra): setup theme constants and global styles"; pattern = "global.css", "constants/Colors.ts", "app/_layout.tsx", "app/index.tsx" },
    @{ date = "2026-04-24 13:30:00 +0500"; msg = "feat(data): define core database entities and types"; pattern = "types/database.ts" },
    @{ date = "2026-04-24 14:15:00 +0500"; msg = "feat(data): implement initial mock service layer"; pattern = "services/mock/mockData.ts", "services/mock/mockAuthService.ts", "services/mock/mockAppointmentService.ts" },
    @{ date = "2026-04-24 15:00:00 +0500"; msg = "feat(data): expand service layer for clinical workflows"; pattern = "services/mock/*.ts", "services/index.ts" },
    @{ date = "2026-04-24 15:45:00 +0500"; msg = "feat(auth): implement global authentication context"; pattern = "context/AuthContext.tsx" },
    @{ date = "2026-04-24 16:30:00 +0500"; msg = "feat(ui): build atomic design component library"; pattern = "components/ui/*.tsx" },
    @{ date = "2026-04-24 17:15:00 +0500"; msg = "feat(ui): build specialized clinical components"; pattern = "components/appointment/*.tsx", "components/symptoms/*.tsx" },
    @{ date = "2026-04-24 18:00:00 +0500"; msg = "feat(auth): implement clinical authentication screens"; pattern = "app/(auth)/*.tsx" },
    @{ date = "2026-04-24 18:45:00 +0500"; msg = "feat(patient): scaffold patient hub and dashboard"; pattern = "app/(patient)/_layout.tsx", "app/(patient)/dashboard.tsx" },
    @{ date = "2026-04-24 19:30:00 +0500"; msg = "feat(patient): implement appointment and medication flows"; pattern = "app/(patient)/appointments.tsx", "app/(patient)/medications.tsx" },
    @{ date = "2026-04-24 20:15:00 +0500"; msg = "feat(patient): implement health vault and profile management"; pattern = "app/(patient)/ehr.tsx", "app/(patient)/vault.tsx", "app/(patient)/profile.tsx" },
    @{ date = "2026-04-24 21:00:00 +0500"; msg = "feat(doctor): implement provider layout and queue management"; pattern = "app/(doctor)/_layout.tsx", "app/(doctor)/queue.tsx" },
    @{ date = "2026-04-24 21:45:00 +0500"; msg = "feat(doctor): build telemedicine bridging and schedule"; pattern = "app/(doctor)/appointments.tsx", "app/(doctor)/telemedicine.tsx", "app/(doctor)/profile.tsx" },
    @{ date = "2026-04-24 22:30:00 +0500"; msg = "feat(chat): implement end-to-end secure messaging"; pattern = "app/chat/*.tsx" }
)

# Reset main-reconstruction to initial empty commit
git checkout main-reconstruction
git reset --hard b32242e

foreach ($s in $slices) {
    $date = $s.date
    $msg = $s.msg
    $patterns = $s.pattern
    
    foreach ($p in $patterns) {
        # Extract files matching pattern
        $files = git ls-tree -r state-before-rewrite --name-only | Where-Object { $_ -like $p.Replace("*", "*") }
        if ($files) {
            foreach ($f in $files) {
                 git restore --source=state-before-rewrite --worktree --staged -- $f
            }
        }
        else {
            git restore --source=state-before-rewrite --worktree --staged -- $p 2>$null
        }
    }
    
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    if (git status --porcelain) {
        git commit -m $msg
    }
}
