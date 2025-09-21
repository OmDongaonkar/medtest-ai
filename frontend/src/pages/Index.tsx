import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Shield, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Upload,
  Download,
  Users,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import TypingEffect from "@/components/TypingEffect";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { login, isLoggedIn } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description: "Advanced AI analyzes your requirements and generates comprehensive, compliant test cases automatically."
    },
    {
      icon: Shield,
      title: "Healthcare Compliance",
      description: "Built-in compliance mapping for HIPAA, FDA 21 CFR Part 11, GxP, and other healthcare standards."
    },
    {
      icon: FileText,
      title: "Full Traceability",
      description: "Complete traceability from requirements to test cases with automated documentation."
    }
  ];

  const benefits = [
    "Reduce test case creation time by 80%",
    "Ensure 100% compliance coverage",
    "Maintain complete audit trails",
    "Integrate with existing tools"
  ];

  const stats = [
    { value: "10,000+", label: "Test Cases Generated" },
    { value: "99.9%", label: "Compliance Accuracy" },
    { value: "80%", label: "Time Saved" },
    { value: "500+", label: "Healthcare Teams" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 px-6">
        <div className="container max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Healthcare Testing
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              <TypingEffect 
                text="Transform Requirements into" 
                speed={80}
              />
              <span className="block text-primary">Compliant Test Cases</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Leverage AI to automatically convert healthcare software requirements into 
              structured, traceable, and compliance-ready test cases in minutes.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Link to="/upload">
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl">
                <Upload className="h-5 w-5 mr-2" />
                Start Testing Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-b border-glass-border">
        <div className="container max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4 animate-slide-up">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground">
              Why Choose MedTest AI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purpose-built for healthcare software testing with enterprise-grade compliance and AI intelligence.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 animate-slide-up">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card hover:shadow-hover transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              From requirements to compliant test cases in three simple steps
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 animate-slide-up">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Upload Requirements</h3>
              <p className="text-muted-foreground">
                Upload your software requirements document or paste them directly into our platform.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI analyzes requirements and generates structured test cases with compliance mapping.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Export & Execute</h3>
              <p className="text-muted-foreground">
                Export to your preferred format or integrate directly with JIRA and other tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-foreground">
                  Built for Healthcare Excellence
                </h2>
                <p className="text-xl text-muted-foreground">
                  MedTest AI understands the unique challenges of healthcare software testing and compliance.
                </p>
              </div>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              {isLoggedIn ? null : (
                <Link to="/auth">
                  <Button size="lg" className="rounded-xl mt-8">
                    <Users className="h-5 w-5 mr-2" />
                    Get Started Today
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
            
            <Card className="glass-card p-8 animate-slide-up">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate test cases in under 60 seconds
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Processing Speed</span>
                    <span className="text-sm font-medium">98%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full w-[98%]"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compliance Coverage</span>
                    <span className="text-sm font-medium">100%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 hero-gradient">
        <div className="container max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground">
            Ready to Transform Your Testing Process?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of healthcare teams already using MedTest AI to streamline their compliance testing.
          </p>
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg" className="text-lg px-8 py-6 rounded-xl">
                  <Upload className="h-5 w-5 mr-2" />
                  Start Testing Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl glass-button">
                  <Users className="h-5 w-5 mr-2" />
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
