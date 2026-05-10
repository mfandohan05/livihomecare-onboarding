import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRound } from 'lucide-react'

export default function PersonalInformationPage({ stepLabel, onNext, initialData, onChange }) {
    const [formData, setFormData] = useState(initialData || {
        lastName: '',
        firstName: '',
        streetAddress: '',
        city: '',
        state: '',
        zip: '',
        primaryPhone: '',
        secondaryPhone: '',
        email: '',

        primaryEmergencyLastName: '',
        primaryEmergencyFirstName: '',
        primaryEmergencyStreetAddress: '',
        primaryEmergencyCity: '',
        primaryEmergencyState: '',
        primaryEmergencyZip: '',
        primaryEmergencyPrimaryPhone: '',
        primaryEmergencySecondaryPhone: '',
        primaryEmergencyEmail: '',
        primaryEmergencyRelationship: '',

        secondaryEmergencyLastName: '',
        secondaryEmergencyFirstName: '',
        secondaryEmergencyStreetAddress: '',
        secondaryEmergencyCity: '',
        secondaryEmergencyState: '',
        secondaryEmergencyZip: '',
        secondaryEmergencyPrimaryPhone: '',
        secondaryEmergencySecondaryPhone: '',
        secondaryEmergencyEmail: '',
        secondaryEmergencyRelationship: '',
    })

    const handleChange = (e) => {
        const updated = { ...formData, [e.target.name]: e.target.value }
        setFormData(updated)
        onChange(updated)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(formData)
        onNext()
    }

    return (
        <div className="max-w-2xl mx-auto py-16 px-8">
            <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">Personal Information</h1>
            <p className="text-muted-foreground mb-8">
                Please fill out all fields accurately. This information will be kept on file at Livi Home Care.
            </p>

            <form onSubmit={handleSubmit} className="space-y-10">

                <div>
                    <h2 className="text-lg font-medium mb-4 pb-2 border-b">Employee Information</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Maria"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Santos"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="streetAddress">Street address</Label>
                            <Input
                                id="streetAddress"
                                name="streetAddress"
                                placeholder="123 Main St"
                                value={formData.streetAddress}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="Charlotte"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    placeholder="NC"
                                    maxLength={2}
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="zip">ZIP code</Label>
                                <Input
                                    id="zip"
                                    name="zip"
                                    placeholder="28201"
                                    maxLength={5}
                                    value={formData.zip}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryPhone">Primary phone</Label>
                                <Input
                                    id="primaryPhone"
                                    name="primaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0123"
                                    value={formData.primaryPhone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryPhone">Secondary phone</Label>
                                <Input
                                    id="secondaryPhone"
                                    name="secondaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0456"
                                    value={formData.secondaryPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="maria@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-medium mb-4 pb-2 border-b">Primary Emergency Contact</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencyFirstName">First name</Label>
                                <Input
                                    id="primaryEmergencyFirstName"
                                    name="primaryEmergencyFirstName"
                                    placeholder="John"
                                    value={formData.primaryEmergencyFirstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencyLastName">Last name</Label>
                                <Input
                                    id="primaryEmergencyLastName"
                                    name="primaryEmergencyLastName"
                                    placeholder="Santos"
                                    value={formData.primaryEmergencyLastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryEmergencyStreetAddress">Street address</Label>
                            <Input
                                id="primaryEmergencyStreetAddress"
                                name="primaryEmergencyStreetAddress"
                                placeholder="123 Main St"
                                value={formData.primaryEmergencyStreetAddress}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="primaryEmergencyCity">City</Label>
                                <Input
                                    id="primaryEmergencyCity"
                                    name="primaryEmergencyCity"
                                    placeholder="Charlotte"
                                    value={formData.primaryEmergencyCity}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="primaryEmergencyState">State</Label>
                                <Input
                                    id="primaryEmergencyState"
                                    name="primaryEmergencyState"
                                    placeholder="NC"
                                    maxLength={2}
                                    value={formData.primaryEmergencyState}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="primaryEmergencyZip">ZIP code</Label>
                                <Input
                                    id="primaryEmergencyZip"
                                    name="primaryEmergencyZip"
                                    placeholder="28201"
                                    maxLength={5}
                                    value={formData.primaryEmergencyZip}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencyPrimaryPhone">Primary phone</Label>
                                <Input
                                    id="primaryEmergencyPrimaryPhone"
                                    name="primaryEmergencyPrimaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0123"
                                    value={formData.primaryEmergencyPrimaryPhone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencySecondaryPhone">Secondary phone</Label>
                                <Input
                                    id="primaryEmergencySecondaryPhone"
                                    name="primaryEmergencySecondaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0456"
                                    value={formData.primaryEmergencySecondaryPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencyEmail">Email</Label>
                                <Input
                                    id="primaryEmergencyEmail"
                                    name="primaryEmergencyEmail"
                                    type="email"
                                    placeholder="john@email.com"
                                    value={formData.primaryEmergencyEmail}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryEmergencyRelationship">Relationship to employee</Label>
                                <Input
                                    id="primaryEmergencyRelationship"
                                    name="primaryEmergencyRelationship"
                                    placeholder="Spouse, Parent, Sibling..."
                                    value={formData.primaryEmergencyRelationship}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-medium mb-4 pb-2 border-b">Secondary Emergency Contact</h2>
                    <p className="text-sm text-muted-foreground mb-4">Optional but recommended.</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencyFirstName">First name</Label>
                                <Input
                                    id="secondaryEmergencyFirstName"
                                    name="secondaryEmergencyFirstName"
                                    placeholder="Jane"
                                    value={formData.secondaryEmergencyFirstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencyLastName">Last name</Label>
                                <Input
                                    id="secondaryEmergencyLastName"
                                    name="secondaryEmergencyLastName"
                                    placeholder="Santos"
                                    value={formData.secondaryEmergencyLastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secondaryEmergencyStreetAddress">Street address</Label>
                            <Input
                                id="secondaryEmergencyStreetAddress"
                                name="secondaryEmergencyStreetAddress"
                                placeholder="123 Main St"
                                value={formData.secondaryEmergencyStreetAddress}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="secondaryEmergencyCity">City</Label>
                                <Input
                                    id="secondaryEmergencyCity"
                                    name="secondaryEmergencyCity"
                                    placeholder="Charlotte"
                                    value={formData.secondaryEmergencyCity}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="secondaryEmergencyState">State</Label>
                                <Input
                                    id="secondaryEmergencyState"
                                    name="secondaryEmergencyState"
                                    placeholder="NC"
                                    maxLength={2}
                                    value={formData.secondaryEmergencyState}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="secondaryEmergencyZip">ZIP code</Label>
                                <Input
                                    id="secondaryEmergencyZip"
                                    name="secondaryEmergencyZip"
                                    placeholder="28201"
                                    maxLength={5}
                                    value={formData.secondaryEmergencyZip}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencyPrimaryPhone">Primary phone</Label>
                                <Input
                                    id="secondaryEmergencyPrimaryPhone"
                                    name="secondaryEmergencyPrimaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0123"
                                    value={formData.secondaryEmergencyPrimaryPhone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencySecondaryPhone">Secondary phone</Label>
                                <Input
                                    id="secondaryEmergencySecondaryPhone"
                                    name="secondaryEmergencySecondaryPhone"
                                    type="tel"
                                    placeholder="(704) 555-0456"
                                    value={formData.secondaryEmergencySecondaryPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencyEmail">Email</Label>
                                <Input
                                    id="secondaryEmergencyEmail"
                                    name="secondaryEmergencyEmail"
                                    type="email"
                                    placeholder="jane@email.com"
                                    value={formData.secondaryEmergencyEmail}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryEmergencyRelationship">Relationship to employee</Label>
                                <Input
                                    id="secondaryEmergencyRelationship"
                                    name="secondaryEmergencyRelationship"
                                    placeholder="Spouse, Parent, Sibling..."
                                    value={formData.secondaryEmergencyRelationship}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8"
                >
                    Save & Continue
                </Button>

            </form>
        </div>
    )
}