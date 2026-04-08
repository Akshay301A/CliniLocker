import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import appMockup from "@/assets/landing/app-mockup.png";

const CliniLockerVsPhysicalFiles = () => {
  useEffect(() => {
    document.title = "CliniLocker vs. Physical Medical Files | CliniLocker";
  }, []);

  return (
    <div className="landing-theme min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">Comparison</span>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                CliniLocker vs. Physical Medical Files: 5 Reasons to Switch
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                Paper files are familiar — but they slow down care and often get lost. Here is a clear, direct
                comparison to help patients and clinics decide.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="rounded-3xl border border-border/60 bg-white/80 shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden">
              <img
                src={appMockup}
                alt="CliniLocker mobile app"
                className="h-56 sm:h-72 w-full object-cover"
              />
              <div className="p-6 sm:p-10 space-y-6 text-muted-foreground">
                <p className="text-base sm:text-lg">
                  Switching to a digital health locker means faster access, safer storage, and easier sharing.
                  Here is a quick, practical comparison between CliniLocker and physical files.
                </p>

                <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white/70">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Feature</th>
                        <th className="px-4 py-3 text-left">CliniLocker</th>
                        <th className="px-4 py-3 text-left">Physical Files</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Security</td>
                        <td className="px-4 py-3">Encrypted storage, access control, activity logs</td>
                        <td className="px-4 py-3">Easily lost or exposed to damage</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Access</td>
                        <td className="px-4 py-3">Anytime, anywhere on mobile or web</td>
                        <td className="px-4 py-3">Only when files are physically available</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Sharing</td>
                        <td className="px-4 py-3">Secure links in seconds</td>
                        <td className="px-4 py-3">Photocopies, couriers, or manual handoff</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Search</td>
                        <td className="px-4 py-3">Instant by report type and date</td>
                        <td className="px-4 py-3">Manual sorting, hard to organize</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Reminders</td>
                        <td className="px-4 py-3">Medication and report alerts</td>
                        <td className="px-4 py-3">Manual tracking only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white/70 p-5 text-sm">
                  <p className="text-foreground font-semibold">Five reasons to switch</p>
                  <ol className="mt-2 list-decimal pl-5 space-y-2">
                    <li>Secure, encrypted storage rather than paper files.</li>
                    <li>Instant access for emergencies or follow-ups.</li>
                    <li>Share reports with doctors in one click.</li>
                    <li>Stay organized with filters, dates, and categories.</li>
                    <li>Receive reminders so nothing is missed.</li>
                  </ol>
                </div>

                <div className="pt-2">
                  <Link to="/blogs" className="text-sm font-semibold text-primary hover:text-primary/80">
                    Back to all blogs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CliniLockerVsPhysicalFiles;
