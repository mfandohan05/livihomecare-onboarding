import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenuItem, SidebarMenuButton, SidebarMenu } from "../ui/sidebar"
import { CircleCheck, Lock, Clock, PauseCircle } from 'lucide-react'
import { Avatar, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import companyLogo from '@/assets/logo.png';
import { APP_VERSION } from "@/version";

const getStatusIcon = (status) => {
    if (status === "completed") return <CircleCheck className="w-4 h-4 text-[#577C09]" />
    if (status === "locked") return <Lock className="w-4 h-4 text-muted-foreground" />
    return null
}

function SidebarComponent({ steps, activeStep, setActiveStep, handleNext, caregiver, resetFormData, isIdle, isCompleted }) {
    const completedCount = steps.filter(s => s.status === "completed").length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);
    const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(caregiver.name)}&background=577C09&color=fff`;

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex flex-row items-center">
                    <img src={companyLogo} alt="Livi Home Care logo" className="w-[80px]" />
                    <span className="font-semibold">Onboarding System<br /><span className="text-xs text-muted-foreground">v{APP_VERSION}</span></span>

                </div>
                <div className="px-4 py-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{completedCount} of {steps.length} complete</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                {steps.map((step) => (
                    <SidebarMenuItem key={step.id}>
                        <SidebarMenuButton
                            disabled={step.status === 'locked' || isCompleted}
                            onClick={() => {
                                if (isCompleted) return
                                if (step.status !== 'locked') setActiveStep(step.id)
                            }}
                            className={
                                step.id === activeStep
                                    ? 'bg-[#E8F0D0] text-[#577C09] font-medium'
                                    : step.status === 'locked'
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isCompleted
                                            ? 'cursor-default'
                                            : ''
                            }
                        >
                            <step.logo className="w-4 h-4" />
                            <span className="flex-1">{step.stepName}</span>
                            {getStatusIcon(step.status)}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <button onClick={handleNext}>(Testing Purposes Only) <br />Skip to the next page</button>
                <button onClick={resetFormData}>(Testing Purposes Only) <br />Clear all form data</button>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    {isIdle ? (
                        <>
                            <PauseCircle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-amber-600">Recording paused — no activity</span>
                        </>
                    ) : (
                        <>
                            <Clock className="w-3 h-3 text-[#577C09] shrink-0" />
                            <span>Onboarding time is being recorded</span>
                        </>
                    )}
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <Avatar>
                                <AvatarImage src={avatarURL} alt={caregiver.name} />
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{caregiver.name}</span>
                                <span className="text-xs text-muted-foreground">{caregiver.email}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

export default SidebarComponent;